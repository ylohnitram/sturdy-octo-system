-- Create RIVALS table
CREATE TABLE IF NOT EXISTS rivals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, recipient_id)
);

-- Enable RLS
ALTER TABLE rivals ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. View: Users can see requests where they are sender OR recipient
CREATE POLICY "Users can view their own rival requests" ON rivals
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- 2. Insert: Users can send requests (as requester)
CREATE POLICY "Users can send rival requests" ON rivals
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 3. Update: Users can accept requests (as recipient)
CREATE POLICY "Users can update their received requests" ON rivals
    FOR UPDATE USING (auth.uid() = recipient_id);

-- 4. Delete: Users can delete requests (cancel or remove rival)
CREATE POLICY "Users can delete their rival connections" ON rivals
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RPC Function to fetch rivals with stats
CREATE OR REPLACE FUNCTION get_rivals_leaderboard(user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    body_count INTEGER,
    weekly_score INTEGER,
    is_premium BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        s.body_count,
        s.weekly_score,
        s.is_premium
    FROM rivals r
    JOIN profiles p ON (p.id = r.requester_id OR p.id = r.recipient_id)
    JOIN user_stats s ON s.user_id = p.id
    WHERE 
        (r.requester_id = user_id OR r.recipient_id = user_id)
        AND r.status = 'accepted'
        AND p.id != user_id -- Exclude self (optional, but usually you want to see yourself separately or added in UI)
    UNION
    -- Add SELF to the leaderboard
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        s.body_count,
        s.weekly_score,
        s.is_premium
    FROM profiles p
    JOIN user_stats s ON s.user_id = p.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
