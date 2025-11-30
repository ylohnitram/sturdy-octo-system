-- =====================================================
-- SUPABASE STORAGE SETUP PRO CHAT MEDIA
-- =====================================================
-- Spusť tento SQL v Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. VYTVOŘENÍ BUCKETU
-- Poznámka: Toto možná nebude fungovat přes SQL Editor
-- Raději vytvoř bucket ručně v Dashboard → Storage → New Bucket
-- Name: chat-media
-- Public: false

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media',
    'chat-media',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS POLICIES PRO STORAGE

-- Policy 1: Upload Media
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 2: View Media
CREATE POLICY "Users can view chat media from matches"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 3: Delete Media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND owner = auth.uid()
);

-- 3. OVĚŘENÍ
-- Zkontroluj, že bucket existuje
SELECT * FROM storage.buckets WHERE id = 'chat-media';

-- Zkontroluj policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%chat media%';
