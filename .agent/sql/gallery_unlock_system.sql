-- =====================================================
-- Gallery Unlock System - Backend SQL
-- =====================================================
-- Version: 2.13.19
-- Created: 2025-11-24
-- Purpose: Revenue-sharing gallery unlock system
-- =====================================================

-- -----------------------------------------------------
-- 1. Table: gallery_unlocks
-- Tracks which users have unlocked which galleries
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_unlocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    cost INTEGER NOT NULL DEFAULT 10,
    revenue_share INTEGER NOT NULL DEFAULT 5, -- 50% goes to owner
    
    -- Prevent duplicate unlocks (same viewer + owner)
    UNIQUE(viewer_id, owner_id),
    
    -- Index for fast lookups
    CONSTRAINT different_users CHECK (viewer_id != owner_id)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_viewer ON gallery_unlocks(viewer_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_owner ON gallery_unlocks(owner_id);

-- Enable RLS
ALTER TABLE gallery_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unlocks"
    ON gallery_unlocks FOR SELECT
    USING (auth.uid() = viewer_id);

CREATE POLICY "Users can view who unlocked their gallery"
    ON gallery_unlocks FOR SELECT
    USING (auth.uid() = owner_id);

-- -----------------------------------------------------
-- 2. RPC Function: unlock_user_gallery
-- Handles gallery unlock with revenue share
-- -----------------------------------------------------
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
BEGIN
    -- Calculate 50% revenue share (rounded up)
    v_revenue_share := CEIL(p_cost * 0.5);
    
    -- Check if already unlocked
    IF EXISTS (
        SELECT 1 FROM gallery_unlocks 
        WHERE viewer_id = p_viewer_id 
        AND owner_id = p_owner_id
    ) THEN
        -- Already unlocked, return success
        RETURN TRUE;
    END IF;
    
    -- Check viewer's coins
    SELECT coins INTO v_viewer_coins
    FROM user_stats
    WHERE user_id = p_viewer_id;
    
    IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
        -- Not enough coins
        RETURN FALSE;
    END IF;
    
    -- Deduct coins from viewer
    UPDATE user_stats
    SET coins = coins - p_cost
    WHERE user_id = p_viewer_id;
    
    -- Add revenue share to owner
    UPDATE user_stats
    SET coins = coins + v_revenue_share
    WHERE user_id = p_owner_id;
    
    -- Record the unlock
    INSERT INTO gallery_unlocks (viewer_id, owner_id, cost, revenue_share)
    VALUES (p_viewer_id, p_owner_id, p_cost, v_revenue_share)
    ON CONFLICT (viewer_id, owner_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- -----------------------------------------------------
-- 3. Helper Function: check_gallery_unlocked
-- Check if a specific user has unlocked a gallery
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION check_gallery_unlocked(
    p_viewer_id UUID,
    p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM gallery_unlocks
        WHERE viewer_id = p_viewer_id
        AND owner_id = p_owner_id
    );
END;
$$;

-- -----------------------------------------------------
-- 4. View: user_gallery_stats
-- Statistics for gallery owners
-- -----------------------------------------------------
CREATE OR REPLACE VIEW user_gallery_stats AS
SELECT
    owner_id,
    COUNT(*) as total_unlocks,
    SUM(revenue_share) as total_earnings,
    MAX(unlocked_at) as last_unlock_at
FROM gallery_unlocks
GROUP BY owner_id;

-- Grant access to authenticated users
GRANT SELECT ON user_gallery_stats TO authenticated;

-- -----------------------------------------------------
-- 5. Update fetchPublicGallery to respect unlocks
-- NOTE: This is handled client-side for now
-- Future: Add a view that joins gallery_images with unlocks
-- -----------------------------------------------------

-- Example query to fetch gallery with unlock status:
-- SELECT 
--     gi.*,
--     CASE 
--         WHEN gi.is_private = false THEN true
--         WHEN gu.id IS NOT NULL THEN true
--         ELSE false
--     END as is_unlocked
-- FROM gallery_images gi
-- LEFT JOIN gallery_unlocks gu 
--     ON gu.owner_id = gi.user_id 
--     AND gu.viewer_id = auth.uid()
-- WHERE gi.user_id = $target_user_id
-- ORDER BY gi.created_at DESC;

-- =====================================================
-- NOTES FOR IMPLEMENTATION:
-- =====================================================
-- 1. Premium users: Check tier on client-side before calling RPC
-- 2. The RPC does NOT check premium status (handled in frontend)
-- 3. Revenue share is 50% (5 credits to owner, 5 disappear)
-- 4. Unlocks are permanent (no expiration)
-- 5. Gallery owners cannot unlock their own gallery (constraint)
--
-- TESTING:
-- SELECT unlock_user_gallery('viewer-uuid', 'owner-uuid', 10);
-- SELECT * FROM gallery_unlocks;
-- SELECT * FROM user_gallery_stats WHERE owner_id = 'owner-uuid';
-- =====================================================
