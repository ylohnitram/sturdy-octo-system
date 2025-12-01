-- Migration: Fix Ghosting Functions
-- Description: Explicitly define ghost_user and unghost_user functions to ensure they work correctly

-- 1. ghost_user function
CREATE OR REPLACE FUNCTION public.ghost_user(p_blocker_id uuid, p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.blocked_users (blocker_id, blocked_id)
    VALUES (p_blocker_id, p_blocked_id)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$;

-- 2. unghost_user function
CREATE OR REPLACE FUNCTION public.unghost_user(p_blocker_id uuid, p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.blocked_users
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;
END;
$$;
