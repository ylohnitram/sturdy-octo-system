-- Migration: Add get_ghost_list RPC function
-- Description: Returns list of users blocked by the current user (ghost list)

CREATE OR REPLACE FUNCTION public.get_ghost_list()
RETURNS TABLE (
    blocked_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT bu.blocked_user_id
    FROM public.blocked_users bu
    WHERE bu.blocker_user_id = auth.uid()
    AND bu.created_at IS NOT NULL;
END;
$$;