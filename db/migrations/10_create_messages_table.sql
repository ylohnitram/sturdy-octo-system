-- Create Messages Table for Chat System
-- This table stores all chat messages between matched users

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can see messages from their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

-- Policies for Messages
-- Users can see messages from their own matches
CREATE POLICY "Users can see messages from their matches" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );

-- Users can insert messages to their own matches (and not to ghosted users)
CREATE POLICY "Users can send messages to their matches" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE (blocker_id = auth.uid() AND blocked_id IN (
                SELECT user1_id FROM matches WHERE id = match_id
                UNION
                SELECT user2_id FROM matches WHERE id = match_id
            ))
            OR (blocked_id = auth.uid() AND blocker_id IN (
                SELECT user1_id FROM matches WHERE id = match_id
                UNION
                SELECT user2_id FROM matches WHERE id = match_id
            ))
        )
    );

-- Users can update read_at for messages they received
CREATE POLICY "Users can mark received messages as read" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
            AND messages.sender_id != auth.uid()
        )
    );

-- Create blocked_users table if it doesn't exist (for ghost functionality)
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS for blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies for blocked_users
CREATE POLICY "Users can see their own blocks" ON public.blocked_users
    FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON public.blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);
