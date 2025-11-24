-- Update get_rivals_leaderboard to use profiles.tier instead of user_stats.is_premium

-- Drop old function first (required when changing return type)
DROP FUNCTION IF EXISTS get_rivals_leaderboard(uuid);

-- Create new function with updated return type
CREATE OR REPLACE FUNCTION get_rivals_leaderboard(user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    avatar_url TEXT,
    body_count INTEGER,
    weekly_score INTEGER,
    tier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        s.body_count,
        s.weekly_score,
        p.tier
    FROM rivals r
    JOIN profiles p ON (p.id = r.requester_id OR p.id = r.recipient_id)
    JOIN user_stats s ON s.user_id = p.id
    WHERE 
        (r.requester_id = user_id OR r.recipient_id = user_id)
        AND r.status = 'accepted'
        AND p.id != user_id
    UNION
    -- Add SELF to the leaderboard
    SELECT 
        p.id,
        p.username,
        p.avatar_url,
        s.body_count,
        s.weekly_score,
        p.tier
    FROM profiles p
    JOIN user_stats s ON s.user_id = p.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
