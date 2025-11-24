-- =====================================================
-- Add Caption Support to Gallery Images
-- =====================================================
-- Allows users to add optional captions/descriptions to photos
-- =====================================================

-- Add caption column to gallery_images
ALTER TABLE gallery_images
ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT NULL;

-- Create index for searching by caption (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_gallery_images_caption 
ON gallery_images(caption) 
WHERE caption IS NOT NULL;

-- Note: RLS policies remain unchanged - captions follow same rules as images
