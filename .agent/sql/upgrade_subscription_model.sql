-- =====================================================
-- Gallery Unlock Upgrade: Subscription Model
-- =====================================================
-- Adds 30-day subscription for galleries with 6+ photos
-- First 5 photos = permanent unlock
-- 6+ photos = requires active subscription
-- =====================================================

-- Step 1: Add new columns to gallery_unlocks
ALTER TABLE gallery_unlocks
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL;

-- Step 2: Create index for expiration checks
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_expires ON gallery_unlocks(expires_at) 
WHERE expires_at IS NOT NULL;

-- Step 3: Update unlock_user_gallery function
CREATE OR REPLACE FUNCTION unlock_user_gallery(
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
    v_private_count INTEGER;
    v_existing_unlock RECORD;
    v_expires_at TIMESTAMP;
    v_is_subscription BOOLEAN;
BEGIN
    -- Calculate 50% revenue share (rounded up)
    v_revenue_share := CEIL(p_cost * 0.5);
    
    -- Count private images in gallery
    SELECT COUNT(*) INTO v_private_count
    FROM gallery_images
    WHERE user_id = p_owner_id AND is_private = true;
    
    -- Determine unlock type
    IF v_private_count <= 5 THEN
        -- Permanent unlock for small galleries
        v_is_subscription := false;
        v_expires_at := NULL;
    ELSE
        -- Subscription for larger galleries
        v_is_subscription := true;
        v_expires_at := NOW() + INTERVAL '30 days';
    END IF;
    
    -- Check for existing unlock
    SELECT * INTO v_existing_unlock
    FROM gallery_unlocks
    WHERE viewer_id = p_viewer_id AND owner_id = p_owner_id;
    
    IF FOUND THEN
        -- Already unlocked - check if renewal needed
        IF v_existing_unlock.is_subscription THEN
            -- Check if expired
            IF v_existing_unlock.expires_at < NOW() THEN
                -- Renewal needed - charge reduced price
                p_cost := 5; -- Renewal discount
                v_revenue_share := CEIL(p_cost * 0.5);
                
                -- Check coins
                SELECT coins INTO v_viewer_coins
                FROM user_stats
                WHERE user_id = p_viewer_id;
                
                IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
                    RETURN FALSE;
                END IF;
                
                -- Process renewal payment
                UPDATE user_stats
                SET coins = coins - p_cost
                WHERE user_id = p_viewer_id;
                
                UPDATE user_stats
                SET coins = coins + v_revenue_share
                WHERE user_id = p_owner_id;
                
                -- Update expiration
                UPDATE gallery_unlocks
                SET expires_at = NOW() + INTERVAL '30 days',
                    cost = p_cost,
                    revenue_share = v_revenue_share
                WHERE viewer_id = p_viewer_id AND owner_id = p_owner_id;
                
                RETURN TRUE;
            ELSE
                -- Still valid - no action needed
                RETURN TRUE;
            END IF;
        ELSE
            -- Permanent unlock already exists
            RETURN TRUE;
        END IF;
    END IF;
    
    -- New unlock - check viewer's coins
    SELECT coins INTO v_viewer_coins
    FROM user_stats
    WHERE user_id = p_viewer_id;
    
    IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
        RETURN FALSE;
    END IF;
    
    -- Process payment
    UPDATE user_stats
    SET coins = coins - p_cost
    WHERE user_id = p_viewer_id;
    
    UPDATE user_stats
    SET coins = coins + v_revenue_share
    WHERE user_id = p_owner_id;
    
    -- Create unlock record
    INSERT INTO gallery_unlocks (viewer_id, owner_id, cost, revenue_share, is_subscription, expires_at)
    VALUES (p_viewer_id, p_owner_id, p_cost, v_revenue_share, v_is_subscription, v_expires_at)
    ON CONFLICT (viewer_id, owner_id) DO UPDATE
    SET expires_at = v_expires_at,
        is_subscription = v_is_subscription,
        cost = p_cost,
        revenue_share = v_revenue_share;
    
    RETURN TRUE;
END;
$$;

-- Step 4: Update check function to respect expiration
CREATE OR REPLACE FUNCTION check_gallery_unlocked(
    p_viewer_id UUID,
    p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unlock RECORD;
BEGIN
    SELECT * INTO v_unlock
    FROM gallery_unlocks
    WHERE viewer_id = p_viewer_id AND owner_id = p_owner_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if subscription-based
    IF v_unlock.is_subscription THEN
        -- Check expiration
        RETURN v_unlock.expires_at > NOW();
    ELSE
        -- Permanent unlock
        RETURN TRUE;
    END IF;
END;
$$;

-- Step 5: Create view for subscription status
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT
    viewer_id,
    owner_id,
    is_subscription,
    expires_at,
    CASE
        WHEN is_subscription = false THEN 'permanent'
        WHEN expires_at > NOW() THEN 'active'
        ELSE 'expired'
    END as status,
    CASE
        WHEN is_subscription = true AND expires_at > NOW() 
        THEN EXTRACT(EPOCH FROM (expires_at - NOW())) / 86400
        ELSE NULL
    END as days_remaining
FROM gallery_unlocks;

GRANT SELECT ON user_subscription_status TO authenticated;

-- Step 6: Update stats view
DROP VIEW IF EXISTS user_gallery_stats CASCADE;

CREATE OR REPLACE VIEW user_gallery_stats AS
SELECT
    owner_id,
    COUNT(*) as total_unlocks,
    COUNT(*) FILTER (WHERE is_subscription = true) as subscription_count,
    COUNT(*) FILTER (WHERE is_subscription = false) as permanent_count,
    COUNT(*) FILTER (WHERE is_subscription = true AND expires_at > NOW()) as active_subscriptions,
    SUM(revenue_share) as total_earnings,
    MAX(unlocked_at) as last_unlock_at
FROM gallery_unlocks
GROUP BY owner_id;

GRANT SELECT ON user_gallery_stats TO authenticated;
