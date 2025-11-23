-- =====================================================
-- STEP 1: Drop old table if exists (clean start)
-- =====================================================
DROP TABLE IF EXISTS gallery_unlocks CASCADE;
DROP VIEW IF EXISTS user_gallery_stats CASCADE;
DROP FUNCTION IF EXISTS unlock_user_gallery(UUID, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_gallery_unlocked(UUID, UUID) CASCADE;
