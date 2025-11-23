-- =====================================================
-- STEP 4: Create views and permissions
-- =====================================================

-- View: user_gallery_stats
CREATE OR REPLACE VIEW user_gallery_stats AS
SELECT
    owner_id,
    COUNT(*) as total_unlocks,
    SUM(revenue_share) as total_earnings,
    MAX(unlocked_at) as last_unlock_at
FROM gallery_unlocks
GROUP BY owner_id;

-- Grant access
GRANT SELECT ON user_gallery_stats TO authenticated;
