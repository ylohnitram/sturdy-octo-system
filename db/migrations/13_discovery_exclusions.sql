-- Migration: Add dismisses table and update discovery exclusion logic
-- Description: Create table for tracking dismissed/rejected profiles and update exclusion logic

-- 1. Create dismisses table
CREATE TABLE IF NOT EXISTS public.dismisses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    to_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.dismisses ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can see their own dismisses" ON public.dismisses
    FOR SELECT USING (auth.uid() = from_user_id);

CREATE POLICY "Users can insert their own dismisses" ON public.dismisses
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 4. Create or replace comprehensive exclusion function
CREATE OR REPLACE FUNCTION get_discovery_exclusions(p_user_id uuid)
RETURNS TABLE (excluded_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- 1. Excluded: Ghosted users (both I ghosted and who ghosted me)
    SELECT bu.blocked_id
    FROM public.blocked_users bu
    WHERE bu.blocker_id = p_user_id
    
    UNION
    
    SELECT bu.blocker_id
    FROM public.blocked_users bu
    WHERE bu.blocked_id = p_user_id
    
    UNION
    
    -- 2. Excluded: Matched users (permanent)
    SELECT CASE
        WHEN m.user1_id = p_user_id THEN m.user2_id
        ELSE m.user1_id
    END
    FROM public.matches m
    WHERE m.user1_id = p_user_id OR m.user2_id = p_user_id
    
    UNION
    
    -- 3. Excluded: Dismissed today
    SELECT d.to_user_id
    FROM public.dismisses d
    WHERE d.from_user_id = p_user_id
    AND DATE(d.created_at) = CURRENT_DATE
    
    UNION
    
    -- 4. Excluded: Already liked today (waiting for their response)
    SELECT l.to_user_id
    FROM public.likes l
    WHERE l.from_user_id = p_user_id
    AND DATE(l.created_at) = CURRENT_DATE;
END;
$$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dismisses_from_user ON public.dismisses(from_user_id);
CREATE INDEX IF NOT EXISTS idx_dismisses_created_at ON public.dismisses(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);

-- 6. Unique index to prevent multiple dismisses per day for same user pair (using UTC date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dismisses_unique_per_day 
ON public.dismisses(from_user_id, to_user_id, ((created_at AT TIME ZONE 'UTC')::date));