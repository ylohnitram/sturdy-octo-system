-- =====================================================
-- FIX: RLS Policy for gallery_images
-- =====================================================
-- Problem: Users cannot view other users' gallery images
-- Solution: Add SELECT policy for authenticated users
-- =====================================================

-- Allow authenticated users to SELECT all gallery images
-- (Privacy is handled by is_private flag and gallery_image_unlocks)
CREATE POLICY "Authenticated users can view all gallery images"
    ON gallery_images
    FOR SELECT
    TO authenticated
    USING (true);

-- Note: Existing INSERT/UPDATE/DELETE policies should only allow owner
-- This policy ONLY affects SELECT operations
