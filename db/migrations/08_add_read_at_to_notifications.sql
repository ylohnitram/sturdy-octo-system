-- Add read_at column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone DEFAULT NULL;

-- Update existing records: set read_at for already read notifications
UPDATE public.notifications 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;
