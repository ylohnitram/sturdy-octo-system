-- Migration: Create Chat RPC Functions
-- Description: Create get_conversation_messages and get_user_matches functions for chat functionality

-- Drop existing functions if they exist (to handle signature changes)
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_matches(uuid);
DROP FUNCTION IF EXISTS public.get_unread_conversations_count(uuid);
DROP FUNCTION IF EXISTS public.mark_conversation_as_read(uuid, uuid);

-- 1. get_conversation_messages function
CREATE FUNCTION public.get_conversation_messages(p_user_id uuid, p_partner_id uuid)
RETURNS TABLE (
    id uuid,
    match_id uuid,
    sender_id uuid,
    content text,
    type text,
    media_url text,
    metadata jsonb,
    created_at timestamp with time zone,
    read_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.match_id,
        m.sender_id,
        m.content,
        m.type,
        m.media_url,
        m.metadata,
        m.created_at,
        m.read_at
    FROM public.messages m
    INNER JOIN public.matches ma ON m.match_id = ma.id
    WHERE (ma.user1_id = p_user_id AND ma.user2_id = p_partner_id)
       OR (ma.user1_id = p_partner_id AND ma.user2_id = p_user_id)
    ORDER BY m.created_at ASC;
END;
$$;

-- 2. get_user_matches function
CREATE FUNCTION public.get_user_matches(p_user_id uuid)
RETURNS TABLE (
    match_id uuid,
    partner_id uuid,
    partner_username text,
    partner_avatar text,
    partner_bio text,
    last_message text,
    last_message_time timestamp with time zone,
    unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_matches AS (
        SELECT 
            m.id as match_id,
            CASE 
                WHEN m.user1_id = p_user_id THEN m.user2_id
                ELSE m.user1_id
            END as partner_id,
            m.created_at as match_created_at
        FROM public.matches m
        WHERE m.user1_id = p_user_id OR m.user2_id = p_user_id
    ),
    last_messages AS (
        SELECT DISTINCT ON (msg.match_id)
            msg.match_id,
            msg.content as last_msg_content,
            msg.created_at as last_msg_time
        FROM public.messages msg
        INNER JOIN user_matches um ON msg.match_id = um.match_id
        ORDER BY msg.match_id, msg.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            msg.match_id,
            COUNT(*) as unread
        FROM public.messages msg
        INNER JOIN user_matches um ON msg.match_id = um.match_id
        WHERE msg.sender_id != p_user_id
          AND msg.read_at IS NULL
        GROUP BY msg.match_id
    )
    SELECT 
        um.match_id,
        um.partner_id,
        p.username as partner_username,
        p.avatar_url as partner_avatar,
        p.bio as partner_bio,
        lm.last_msg_content as last_message,
        lm.last_msg_time as last_message_time,
        COALESCE(uc.unread, 0) as unread_count
    FROM user_matches um
    INNER JOIN public.profiles p ON p.id = um.partner_id
    LEFT JOIN last_messages lm ON lm.match_id = um.match_id
    LEFT JOIN unread_counts uc ON uc.match_id = um.match_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = um.partner_id)
           OR (bu.blocker_id = um.partner_id AND bu.blocked_id = p_user_id)
    )
    ORDER BY COALESCE(lm.last_msg_time, um.match_created_at) DESC;
END;
$$;

-- 3. get_unread_conversations_count function
CREATE FUNCTION public.get_unread_conversations_count(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count bigint;
BEGIN
    SELECT COUNT(DISTINCT m.match_id)
    INTO unread_count
    FROM public.messages m
    INNER JOIN public.matches ma ON m.match_id = ma.id
    WHERE (ma.user1_id = p_user_id OR ma.user2_id = p_user_id)
      AND m.sender_id != p_user_id
      AND m.read_at IS NULL;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;

-- 4. mark_conversation_as_read function
CREATE FUNCTION public.mark_conversation_as_read(p_user_id uuid, p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.messages m
    SET read_at = NOW()
    FROM public.matches ma
    WHERE m.match_id = ma.id
      AND ((ma.user1_id = p_user_id AND ma.user2_id = p_partner_id)
           OR (ma.user1_id = p_partner_id AND ma.user2_id = p_user_id))
      AND m.sender_id = p_partner_id
      AND m.read_at IS NULL;
END;
$$;
