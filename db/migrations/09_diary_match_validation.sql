-- Migration: Diary Match Validation
-- Ensures users can only add people to diary from platform with match + messages requirement

-- Add partner_age_at_match to journal_entries (age calculated at match time, immutable)
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS partner_age_at_match INT;

-- RPC Function to check if a user can be added to the diary
-- Requirements:
-- 1. Both users must have a match
-- 2. Both users must have sent at least 1 message to each other
CREATE OR REPLACE FUNCTION can_add_to_diary(
    p_requester_id UUID,
    p_target_id UUID
) RETURNS TABLE (
    can_add BOOLEAN,
    match_id UUID,
    match_created_at TIMESTAMP WITH TIME ZONE,
    target_age_at_match INT,
    reason TEXT
) AS $$
DECLARE
    v_match_id UUID;
    v_match_created_at TIMESTAMP WITH TIME ZONE;
    v_requester_sent BOOLEAN;
    v_target_sent BOOLEAN;
    v_target_birth_date DATE;
    v_target_age_at_match INT;
BEGIN
    -- Check if a match exists between the two users
    SELECT id, created_at
    INTO v_match_id, v_match_created_at
    FROM matches
    WHERE (user1_id = p_requester_id AND user2_id = p_target_id)
       OR (user1_id = p_target_id AND user2_id = p_requester_id)
    LIMIT 1;

    -- If no match exists, return false
    IF v_match_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE, NULL::INT, 'Nemáte spolu match.'::TEXT;
        RETURN;
    END IF;

    -- Check if requester has sent at least 1 message
    SELECT EXISTS (
        SELECT 1
        FROM messages
        WHERE match_id = v_match_id
          AND sender_id = p_requester_id
    ) INTO v_requester_sent;

    -- Check if target has sent at least 1 message
    SELECT EXISTS (
        SELECT 1
        FROM messages
        WHERE match_id = v_match_id
          AND sender_id = p_target_id
    ) INTO v_target_sent;

    -- If both haven't sent messages, return false
    IF NOT v_requester_sent OR NOT v_target_sent THEN
        RETURN QUERY SELECT FALSE, v_match_id, v_match_created_at, NULL::INT, 'Museli jste si oba poslat aspoň 1 zprávu.'::TEXT;
        RETURN;
    END IF;

    -- Calculate target's age at match time
    SELECT birth_date INTO v_target_birth_date
    FROM profiles
    WHERE id = p_target_id;

    IF v_target_birth_date IS NOT NULL THEN
        -- Calculate age at match creation
        v_target_age_at_match := DATE_PART('year', AGE(v_match_created_at::DATE, v_target_birth_date));
    ELSE
        v_target_age_at_match := NULL;
    END IF;

    -- All conditions met
    RETURN QUERY SELECT TRUE, v_match_id, v_match_created_at, v_target_age_at_match, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
