-- Chat System & Ghost Mode Implementation

-- 1. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- 2. Blocked Users (Ghost Mode)
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES auth.users(id) NOT NULL,
    blocked_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

-- 3. RLS Policies

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
CREATE POLICY "Users can view messages in their matches" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their matches" ON messages;
CREATE POLICY "Users can insert messages in their matches" ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Blocked Users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
CREATE POLICY "Users can view their own blocks" ON blocked_users
    FOR SELECT
    USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others" ON blocked_users
    FOR INSERT
    WITH CHECK (blocker_id = auth.uid());

-- 4. Helper Functions

-- Fetch Conversation Messages (All messages between two users across all matches)
CREATE OR REPLACE FUNCTION get_conversation_messages(p_user_id UUID, p_partner_id UUID)
RETURNS TABLE (
    id UUID,
    match_id UUID,
    sender_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        msg.id,
        msg.match_id,
        msg.sender_id,
        msg.content,
        msg.created_at,
        msg.read_at
    FROM messages msg
    JOIN matches m ON m.id = msg.match_id
    WHERE (m.user1_id = p_user_id AND m.user2_id = p_partner_id)
       OR (m.user1_id = p_partner_id AND m.user2_id = p_user_id)
    ORDER BY msg.created_at ASC;
END;
$$;

-- Fetch Matches with Last Message and Profile (Grouped by Partner)
CREATE OR REPLACE FUNCTION get_user_matches(p_user_id UUID)
RETURNS TABLE (
    match_id UUID, -- The latest match ID
    partner_id UUID,
    partner_username TEXT,
    partner_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH unique_partners AS (
        SELECT DISTINCT
            CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END as partner_id
        FROM matches m
        WHERE m.user1_id = p_user_id OR m.user2_id = p_user_id
    )
    SELECT 
        -- Get latest match ID for this partner
        (
            SELECT m.id 
            FROM matches m 
            WHERE (m.user1_id = p_user_id AND m.user2_id = up.partner_id) 
               OR (m.user1_id = up.partner_id AND m.user2_id = p_user_id)
            ORDER BY m.created_at DESC 
            LIMIT 1
        ) as match_id,
        up.partner_id,
        p.username,
        p.avatar_url,
        -- Last message
        (
            SELECT msg.content 
            FROM messages msg 
            JOIN matches m ON m.id = msg.match_id 
            WHERE (m.user1_id = p_user_id AND m.user2_id = up.partner_id) 
               OR (m.user1_id = up.partner_id AND m.user2_id = p_user_id)
            ORDER BY msg.created_at DESC 
            LIMIT 1
        ) as last_message,
        (
            SELECT msg.created_at 
            FROM messages msg 
            JOIN matches m ON m.id = msg.match_id 
            WHERE (m.user1_id = p_user_id AND m.user2_id = up.partner_id) 
               OR (m.user1_id = up.partner_id AND m.user2_id = p_user_id)
            ORDER BY msg.created_at DESC 
            LIMIT 1
        ) as last_message_time,
        -- Unread count
        (
            SELECT COUNT(*) 
            FROM messages msg 
            JOIN matches m ON m.id = msg.match_id 
            WHERE ((m.user1_id = p_user_id AND m.user2_id = up.partner_id) OR (m.user1_id = up.partner_id AND m.user2_id = p_user_id))
            AND msg.sender_id != p_user_id 
            AND msg.read_at IS NULL
        ) as unread_count
    FROM unique_partners up
    JOIN profiles p ON p.id = up.partner_id
    WHERE NOT EXISTS (
        SELECT 1 FROM blocked_users b 
        WHERE (b.blocker_id = p_user_id AND b.blocked_id = up.partner_id) 
           OR (b.blocker_id = up.partner_id AND b.blocked_id = p_user_id)
    )
    ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

-- Ghost User Function
CREATE OR REPLACE FUNCTION ghost_user(p_blocker_id UUID, p_blocked_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO blocked_users (blocker_id, blocked_id)
    VALUES (p_blocker_id, p_blocked_id)
    ON CONFLICT DO NOTHING;
END;
$$;
