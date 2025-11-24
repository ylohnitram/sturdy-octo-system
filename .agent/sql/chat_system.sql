-- Chat System & Ghost Mode Implementation

-- 0. Update notifications table to support 'message' type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like', 'proximity', 'system', 'match', 'rival', 'message'));

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
            AND NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker_id = m.user1_id AND b.blocked_id = m.user2_id)
                   OR (b.blocker_id = m.user2_id AND b.blocked_id = m.user1_id)
            )
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

-- Unghost User Function (Remove from blocked list)
CREATE OR REPLACE FUNCTION unghost_user(p_blocker_id UUID, p_blocked_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM blocked_users
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;
END;
$$;

-- Get Ghost List (Users I have ghosted)
CREATE OR REPLACE FUNCTION get_ghost_list(p_user_id UUID)
RETURNS TABLE (
    blocked_id UUID,
    username TEXT,
    avatar_url TEXT,
    blocked_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.blocked_id,
        p.username,
        p.avatar_url,
        b.created_at as blocked_at
    FROM blocked_users b
    JOIN profiles p ON p.id = b.blocked_id
    WHERE b.blocker_id = p_user_id
    ORDER BY b.created_at DESC;
END;
$$;

-- Mark Conversation as Read (and notifications)
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_user_id UUID, p_partner_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Mark messages as read
    UPDATE messages
    SET read_at = now()
    WHERE sender_id = p_partner_id
    AND read_at IS NULL
    AND match_id IN (
        SELECT id FROM matches 
        WHERE (user1_id = p_user_id AND user2_id = p_partner_id)
           OR (user1_id = p_partner_id AND user2_id = p_user_id)
    );

    -- Mark notifications as read
    UPDATE notifications
    SET read_at = now()
    WHERE user_id = p_user_id
    AND related_user_id = p_partner_id
    AND type = 'message'
    AND read_at IS NULL;
END;
$$;

-- Get Unread Conversations Count
CREATE OR REPLACE FUNCTION get_unread_conversations_count(p_user_id UUID)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(DISTINCT m.sender_id) INTO v_count
    FROM messages m
    JOIN matches mat ON mat.id = m.match_id
    WHERE (mat.user1_id = p_user_id OR mat.user2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.read_at IS NULL;
    
    RETURN v_count;
END;
$$;

-- 5. Enable Realtime
-- This is critical for chat updates to work!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 6. Notifications Trigger
CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_username TEXT;
    v_unread_count INT;
BEGIN
    -- Find recipient (the other user in the match)
    SELECT 
        CASE 
            WHEN m.user1_id = NEW.sender_id THEN m.user2_id 
            ELSE m.user1_id 
        END INTO v_recipient_id
    FROM matches m
    WHERE m.id = NEW.match_id;

    -- Check if ghosted/blocked
    IF EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE (blocker_id = v_recipient_id AND blocked_id = NEW.sender_id)
    ) THEN
        RETURN NEW; -- Do nothing if blocked
    END IF;

    -- Check for existing unread messages from this sender to this recipient
    -- We want to notify ONLY if this is the FIRST unread message.
    SELECT COUNT(*) INTO v_unread_count
    FROM messages m
    JOIN matches mat ON mat.id = m.match_id
    WHERE m.sender_id = NEW.sender_id
    AND (
        (mat.user1_id = v_recipient_id AND mat.user2_id = NEW.sender_id) OR
        (mat.user1_id = NEW.sender_id AND mat.user2_id = v_recipient_id)
    )
    AND m.read_at IS NULL;
    
    -- If v_unread_count > 1, it means there were already unread messages (including this one).
    -- So we DO NOT send a notification.
    IF v_unread_count > 1 THEN
        RETURN NEW;
    END IF;

    -- Get sender username
    SELECT username INTO v_sender_username
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Insert notification
    INSERT INTO notifications (user_id, type, content, related_user_id, created_at)
    VALUES (
        v_recipient_id, 
        'message', 
        'Nová zpráva od ' || COALESCE(v_sender_username, 'Uživatel'), 
        NEW.sender_id, 
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message_notification();
