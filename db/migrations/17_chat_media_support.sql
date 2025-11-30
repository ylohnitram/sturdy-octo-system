-- Add multimedia support to messages table
-- This migration adds support for images and audio messages in chat

-- Add new columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for media messages
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_media_url ON public.messages(media_url) WHERE media_url IS NOT NULL;

-- Update the content column to be nullable (for media-only messages)
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Create storage bucket for chat media (if not exists)
-- Note: This needs to be run in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('chat-media', 'chat-media', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for chat-media bucket
-- These policies ensure only matched users can access each other's media

-- Policy: Users can upload media to their own matches
-- CREATE POLICY "Users can upload chat media" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (
--     bucket_id = 'chat-media'
--     AND (storage.foldername(name))[1] IN (
--         SELECT id::text FROM matches 
--         WHERE user1_id = auth.uid() OR user2_id = auth.uid()
--     )
-- );

-- Policy: Users can view media from their matches
-- CREATE POLICY "Users can view chat media from matches" ON storage.objects
-- FOR SELECT TO authenticated
-- USING (
--     bucket_id = 'chat-media'
--     AND (storage.foldername(name))[1] IN (
--         SELECT id::text FROM matches 
--         WHERE user1_id = auth.uid() OR user2_id = auth.uid()
--     )
-- );

-- Policy: Users can delete their own uploaded media
-- CREATE POLICY "Users can delete their own chat media" ON storage.objects
-- FOR DELETE TO authenticated
-- USING (
--     bucket_id = 'chat-media'
--     AND owner = auth.uid()
-- );

-- Add comment to document the schema
COMMENT ON COLUMN public.messages.type IS 'Message type: text, image, or audio';
COMMENT ON COLUMN public.messages.media_url IS 'URL to media file in Supabase Storage (for image/audio messages)';
COMMENT ON COLUMN public.messages.metadata IS 'Additional metadata: duration for audio, dimensions for images, etc.';
