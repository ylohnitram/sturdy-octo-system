-- =====================================================
-- STEP 2: Create gallery_unlocks table
-- =====================================================
CREATE TABLE gallery_unlocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    cost INTEGER NOT NULL DEFAULT 10,
    revenue_share INTEGER NOT NULL DEFAULT 5,
    
    UNIQUE(viewer_id, owner_id),
    CONSTRAINT different_users CHECK (viewer_id != owner_id)
);

-- Create indices
CREATE INDEX idx_gallery_unlocks_viewer ON gallery_unlocks(viewer_id);
CREATE INDEX idx_gallery_unlocks_owner ON gallery_unlocks(owner_id);

-- Enable RLS
ALTER TABLE gallery_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unlocks"
    ON gallery_unlocks FOR SELECT
    USING (auth.uid() = viewer_id);

CREATE POLICY "Users can view who unlocked their gallery"
    ON gallery_unlocks FOR SELECT
    USING (auth.uid() = owner_id);
