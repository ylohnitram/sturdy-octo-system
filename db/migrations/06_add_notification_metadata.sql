-- Add related_user_id to notifications to know WHO triggered it
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_user_id uuid REFERENCES public.profiles(id);

-- Add metadata for extra flexibility (e.g. JSON data)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update RLS to ensure users can still see their own notifications
-- (Existing policy "Users can see own notifications" should cover this as it filters by user_id)
