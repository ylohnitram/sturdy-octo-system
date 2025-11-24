-- Funkce pro získání ID uživatelů, kteří by měli být skryti z discovery (Lov/Radar)
-- Zahrnuje uživatele, které jsem ghostnul (blocked_users.blocker_id = me)
-- A uživatele, kteří ghostnuli mě (blocked_users.blocked_id = me)

CREATE OR REPLACE FUNCTION get_excluded_user_ids(p_user_id UUID)
RETURNS TABLE (excluded_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Koho jsem bloknul já
    SELECT blocked_id FROM blocked_users WHERE blocker_id = p_user_id
    UNION
    -- Kdo bloknul mě
    SELECT blocker_id FROM blocked_users WHERE blocked_id = p_user_id;
END;
$$;
