-- Enable Realtime for Notifications
alter publication supabase_realtime add table notifications;

-- Create Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id uuid REFERENCES public.profiles(id) NOT NULL,
    user2_id uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id)
);

-- Enable RLS for Matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Policies for Matches
CREATE POLICY "Users can see their own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow system/functions to insert matches (usually done via service role or function, but for now let's allow authenticated users to insert if they are part of the match - though strictly this should be handled by the sendLike logic which might need to be an RPC if we want strict security. For now, we'll rely on the client-side logic or a future RPC. Let's actually make it secure by only allowing inserts where auth.uid is one of the users, although really this should be server-side.)
-- Better approach: We will handle the match creation in the `sendLike` logic. If we do it client-side (as per current architecture), we need to allow insert.
CREATE POLICY "Users can insert matches if they are involved" ON public.matches
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
