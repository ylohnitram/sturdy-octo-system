-- =====================================================
-- Gallery Image-Level Unlock System (Locked by ID)
-- =====================================================
-- Monetization-optimized: Tracks specific image unlocks
-- If owner deletes photo, user loses access (incentive to renew)
-- =====================================================

-- Step 1: Create gallery_image_unlocks table
CREATE TABLE IF NOT EXISTS gallery_image_unlocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES gallery_images(id) ON DELETE CASCADE,
    unlock_type TEXT NOT NULL CHECK (unlock_type IN ('permanent', 'subscription')),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NULL,
    
    UNIQUE(viewer_id, image_id)
);

-- Indices
CREATE INDEX idx_image_unlocks_viewer ON gallery_image_unlocks(viewer_id);
CREATE INDEX idx_image_unlocks_image ON gallery_image_unlocks(image_id);
CREATE INDEX idx_image_unlocks_expires ON gallery_image_unlocks(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE gallery_image_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own image unlocks"
    ON gallery_image_unlocks FOR SELECT
    USING (auth.uid() = viewer_id);

-- Step 2: Update gallery_unlocks to track base unlock (keep for stats)
ALTER TABLE gallery_unlocks
ADD COLUMN IF NOT EXISTS unlocked_image_ids UUID[] DEFAULT '{}';

-- Step 3: New unlock function with image-level tracking
CREATE OR REPLACE FUNCTION unlock_user_gallery_v2(
    p_viewer_id UUID,
    p_owner_id UUID,
    p_cost INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_viewer_coins INTEGER;
    v_revenue_share INTEGER;
    v_image RECORD;
    v_image_count INTEGER := 0;
    v_permanent_count INTEGER := 5;
    v_existing_unlock RECORD;
    v_is_renewal BOOLEAN := false;
BEGIN
    v_revenue_share := CEIL(p_cost * 0.5);
    
    -- Check for existing unlock
    SELECT * INTO v_existing_unlock
    FROM gallery_unlocks
    WHERE viewer_id = p_viewer_id AND owner_id = p_owner_id;
    
    IF FOUND AND v_existing_unlock.expires_at > NOW() THEN
        -- Still active subscription
        RETURN TRUE;
    ELSIF FOUND THEN
        -- Expired subscription - this is renewal
        v_is_renewal := true;
        p_cost := 5; -- Renewal discount
        v_revenue_share := CEIL(p_cost * 0.5);
    END IF;
    
    -- Check coins
    SELECT coins INTO v_viewer_coins
    FROM user_stats
    WHERE user_id = p_viewer_id;
    
    IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
        RETURN FALSE;
    END IF;
    
    -- Process payment
    UPDATE user_stats SET coins = coins - p_cost WHERE user_id = p_viewer_id;
    UPDATE user_stats SET coins = coins + v_revenue_share WHERE user_id = p_owner_id;
    
    IF v_is_renewal THEN
        -- Renewal: extend subscription images
        UPDATE gallery_image_unlocks
        SET expires_at = NOW() + INTERVAL '30 days'
        WHERE viewer_id = p_viewer_id 
        AND unlock_type = 'subscription'
        AND image_id IN (
            SELECT id FROM gallery_images WHERE user_id = p_owner_id AND is_private = true
        );
        
        UPDATE gallery_unlocks
        SET expires_at = NOW() + INTERVAL '30 days',
            cost = p_cost,
            revenue_share = v_revenue_share
        WHERE viewer_id = p_viewer_id AND owner_id = p_owner_id;
    ELSE
        -- New unlock: lock specific images
        FOR v_image IN 
            SELECT id FROM gallery_images 
            WHERE user_id = p_owner_id AND is_private = true 
            ORDER BY created_at ASC
        LOOP
            v_image_count := v_image_count + 1;
            
            IF v_image_count <= v_permanent_count THEN
                -- First 5 images = permanent
                INSERT INTO gallery_image_unlocks (viewer_id, image_id, unlock_type, expires_at)
                VALUES (p_viewer_id, v_image.id, 'permanent', NULL)
                ON CONFLICT (viewer_id, image_id) DO NOTHING;
            ELSE
                -- Images 6+ = subscription (30 days)
                INSERT INTO gallery_image_unlocks (viewer_id, image_id, unlock_type, expires_at)
                VALUES (p_viewer_id, v_image.id, 'subscription', NOW() + INTERVAL '30 days')
                ON CONFLICT (viewer_id, image_id) DO NOTHING;
            END IF;
        END LOOP;
        
        -- Record base unlock
        INSERT INTO gallery_unlocks (viewer_id, owner_id, cost, revenue_share, is_subscription, expires_at)
        VALUES (p_viewer_id, p_owner_id, p_cost, v_revenue_share, v_image_count > v_permanent_count, 
                CASE WHEN v_image_count > v_permanent_count THEN NOW() + INTERVAL '30 days' ELSE NULL END)
        ON CONFLICT (viewer_id, owner_id) DO UPDATE
        SET expires_at = CASE WHEN v_image_count > v_permanent_count THEN NOW() + INTERVAL '30 days' ELSE NULL END,
            is_subscription = v_image_count > v_permanent_count;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Step 4: Function to check if specific image is unlocked
CREATE OR REPLACE FUNCTION check_image_unlocked(
    p_viewer_id UUID,
    p_image_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unlock RECORD;
BEGIN
    SELECT * INTO v_unlock
    FROM gallery_image_unlocks
    WHERE viewer_id = p_viewer_id AND image_id = p_image_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiration
    IF v_unlock.unlock_type = 'subscription' THEN
        RETURN v_unlock.expires_at IS NULL OR v_unlock.expires_at > NOW();
    ELSE
        RETURN TRUE; -- Permanent
    END IF;
END;
$$;

-- Step 5: View for user's unlocked images
CREATE OR REPLACE VIEW user_unlocked_images AS
SELECT
    iu.viewer_id,
    iu.image_id,
    gi.user_id as owner_id,
    iu.unlock_type,
    iu.expires_at,
    CASE
        WHEN iu.unlock_type = 'permanent' THEN 'permanent'
        WHEN iu.expires_at > NOW() THEN 'active'
        ELSE 'expired'
    END as status
FROM gallery_image_unlocks iu
JOIN gallery_images gi ON gi.id = iu.image_id;

GRANT SELECT ON user_unlocked_images TO authenticated;

-- Step 6: Stats view update
DROP VIEW IF EXISTS user_gallery_stats CASCADE;

CREATE OR REPLACE VIEW user_gallery_stats AS
SELECT
    gi.user_id as owner_id,
    COUNT(DISTINCT iu.viewer_id) as total_viewers,
    COUNT(DISTINCT iu.viewer_id) FILTER (WHERE iu.unlock_type = 'permanent') as permanent_viewers,
    COUNT(DISTINCT iu.viewer_id) FILTER (WHERE iu.unlock_type = 'subscription' AND iu.expires_at > NOW()) as active_subscribers,
    COUNT(*) FILTER (WHERE iu.unlock_type = 'permanent') as permanent_image_unlocks,
    COUNT(*) FILTER (WHERE iu.unlock_type = 'subscription' AND iu.expires_at > NOW()) as subscription_image_unlocks
FROM gallery_images gi
LEFT JOIN gallery_image_unlocks iu ON iu.image_id = gi.id
WHERE gi.is_private = true
GROUP BY gi.user_id;

GRANT SELECT ON user_gallery_stats TO authenticated;

-- =====================================================
-- MIGRATION NOTES:
-- =====================================================
-- This is a BREAKING change from the previous system
-- Old unlocks won't automatically migrate
-- Consider running data migration if needed
-- New unlocks will use image-level tracking
-- =====================================================
