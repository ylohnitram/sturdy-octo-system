# Chat Media Setup Guide

This guide explains how to set up multimedia messaging (photos and audio) in the chat feature.

## Database Migration

The database migration has been created at `db/migrations/17_chat_media_support.sql`. This migration:

1. Adds `type`, `media_url`, and `metadata` columns to the `messages` table
2. Makes the `content` column nullable (for media-only messages)
3. Adds indexes for better query performance
4. Includes commented SQL for storage bucket policies

## Supabase Storage Setup

### 1. Create the Storage Bucket

In the Supabase Dashboard:

1. Go to **Storage** → **Buckets**
2. Click **New Bucket**
3. Name: `chat-media`
4. **Public**: Set to `true` (✅ **PUBLIC BUCKET**)
   - ⚠️ **Important:** Even though the bucket is public, RLS policies control who can access the files
   - This ensures images are visible to both sender and receiver
5. Click **Create Bucket**

**Why Public Bucket?**
- ✅ Images visible to all match participants
- ✅ No issues with signed URLs
- ✅ RLS policies provide security
- ✅ Simpler and more reliable

### 2. Set Up Storage Policies

After creating the bucket, you need to add RLS (Row Level Security) policies to control access.

Go to **Storage** → **Policies** and add the following policies for the `chat-media` bucket:

#### Policy 1: Upload Media
```sql
-- Allow users to upload media to their own matches
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
```

#### Policy 2: View Media
```sql
-- Allow users to view media from their matches
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
```

#### Policy 3: Delete Media
```sql
-- Allow users to delete their own uploaded media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND owner = auth.uid()
);
```

### 3. Run the Database Migration

Execute the migration file in your Supabase SQL Editor:

```bash
# Copy the contents of db/migrations/17_chat_media_support.sql
# and run it in Supabase Dashboard → SQL Editor
```

Or if you have Supabase CLI set up:

```bash
supabase db push
```

## Features Implemented

### 1. Image Messages
- **Upload**: Click the image icon to select a photo from gallery or camera
- **Compression**: Images are automatically compressed to max 1920px width at 80% JPEG quality
- **Preview**: Shows a preview modal before sending with optional caption
- **Display**: Images appear in chat bubbles with click-to-expand functionality
- **Lightbox**: Click any image to view it fullscreen

### 2. Audio Messages
- **Record**: Click the microphone icon (appears when input is empty)
- **Tap-to-record**: Click to start, click again to stop
- **Duration**: Shows recording duration in real-time
- **Cancel**: Option to cancel recording before sending
- **Playback**: Custom audio player with play/pause, progress bar, and time display

### 3. Text Messages
- **Existing functionality**: All existing text messaging features remain unchanged
- **Emoji picker**: Still available
- **AI Wingman**: Still available

## File Structure

```
components/
├── ChatView.tsx              # Main chat component (updated)
├── AudioRecorder.tsx         # Audio recording component (new)
├── AudioPlayer.tsx           # Audio playback component (new)
├── ImagePreviewModal.tsx     # Image preview before sending (new)
└── ImageLightbox.tsx         # Fullscreen image viewer (new)

services/
├── userService.ts            # Updated sendMessage function
└── mediaUtils.ts             # Media compression and validation (new)

types.ts                      # Updated with MessageType and MessageMetadata

db/migrations/
└── 17_chat_media_support.sql # Database migration (new)
```

## Usage

### Sending a Photo

1. Open a chat conversation
2. Click the **image icon** (📷) on the left side of the input bar
3. Select a photo from your gallery or take a new one
4. (Optional) Add a caption
5. Click **Send**

### Sending an Audio Message

1. Open a chat conversation
2. Make sure the text input is empty
3. Click the **microphone icon** (🎤) on the right side
4. Click to start recording
5. Click the send button to stop and send, or X to cancel

### Viewing Media

- **Images**: Click on any image in the chat to view it fullscreen
- **Audio**: Click the play button to listen to audio messages

## Security Considerations

1. **Private Storage**: All media is stored in a private bucket with RLS policies
2. **Access Control**: Only users who are matched can access each other's media
3. **File Validation**: Images and audio files are validated before upload
4. **Size Limits**: 
   - Images: 10MB max (compressed before upload)
   - Audio: 5MB max

## Browser Compatibility

- **Image Upload**: Works on all modern browsers
- **Audio Recording**: Requires `MediaRecorder` API support
  - ✅ Chrome/Edge 49+
  - ✅ Firefox 25+
  - ✅ Safari 14.1+
  - ✅ Mobile browsers (iOS Safari 14.5+, Chrome Android)

## Troubleshooting

### Images not uploading
1. Check that the `chat-media` bucket exists in Supabase Storage
2. Verify storage policies are correctly set up
3. Check browser console for errors

### Audio recording not working
1. Ensure microphone permissions are granted
2. Check that the browser supports `MediaRecorder` API
3. Try using HTTPS (required for microphone access)

### Media not displaying
1. Verify the database migration ran successfully
2. Check that `type`, `media_url`, and `metadata` columns exist in `messages` table
3. Ensure storage policies allow SELECT access

## Next Steps

Consider implementing:
- [ ] Image editing (crop, rotate, filters)
- [ ] Video messages
- [ ] File attachments (PDFs, documents)
- [ ] Message deletion with media cleanup
- [ ] Media gallery view for each conversation
- [ ] Automatic media cleanup for old messages
