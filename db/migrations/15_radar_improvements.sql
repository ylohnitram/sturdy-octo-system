-- Migration: Radar Improvements - Interactive Hotspots with Ghost Filtering
-- Description: Update hotspot logic to exclude ghosts and track target vs depleted locations

-- 1. Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS get_active_hotspots(float, float, float);

-- 2. Create updated get_active_hotspots with target_count
CREATE OR REPLACE FUNCTION get_active_hotspots(radius_km float, current_lat float, current_long float)
RETURNS TABLE (
  id uuid,
  name text,
  distance float,
  count bigint,
  target_count bigint,
  label text,
  latitude float,
  longitude float
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH ghost_list AS (
    -- Users who ghosted me or I ghosted
    SELECT bu.blocked_id AS ghost_id
    FROM public.blocked_users bu
    WHERE bu.blocker_id = auth.uid()
    UNION
    SELECT bu.blocker_id AS ghost_id
    FROM public.blocked_users bu
    WHERE bu.blocked_id = auth.uid()
  ),
  active_users AS (
    SELECT p.id, p.latitude, p.longitude
    FROM public.profiles p
    WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.last_location_update > (now() - interval '4 hours') -- Active in last 4 hours
    AND p.id != auth.uid() -- Don't count myself
    AND p.id NOT IN (SELECT ghost_id FROM ghost_list) -- Exclude ghosts
  ),
  reacted_users AS (
    -- Users I've already liked
    SELECT l.to_user_id AS user_id
    FROM public.likes l
    WHERE l.from_user_id = auth.uid()
    UNION
    -- Users I've dismissed
    SELECT d.to_user_id AS user_id
    FROM public.dismisses d
    WHERE d.from_user_id = auth.uid()
    UNION
    -- Users I've matched with
    SELECT CASE
      WHEN m.user1_id = auth.uid() THEN m.user2_id
      ELSE m.user1_id
    END AS user_id
    FROM public.matches m
    WHERE m.user1_id = auth.uid() OR m.user2_id = auth.uid()
  ),
  nearby_places AS (
    SELECT 
      p.id,
      p.name,
      p.type,
      p.latitude,
      p.longitude,
      (
        6371 * acos(
          least(1.0, greatest(-1.0, 
            cos(radians(current_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(current_long)) +
            sin(radians(current_lat)) * sin(radians(p.latitude))
          ))
        )
      ) AS dist
    FROM public.places p
  )
  SELECT 
    np.id,
    np.name,
    np.dist as distance,
    COUNT(au.id) as count,
    COUNT(au.id) FILTER (WHERE au.id NOT IN (SELECT user_id FROM reacted_users)) as target_count,
    np.type as label,
    np.latitude,
    np.longitude
  FROM nearby_places np
  LEFT JOIN active_users au ON (
    6371 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(np.latitude)) * cos(radians(au.latitude)) * cos(radians(au.longitude) - radians(np.longitude)) +
        sin(radians(np.latitude)) * sin(radians(au.latitude))
      ))
    )
  ) <= 0.5 -- User is within 500m of the place
  WHERE np.dist <= radius_km
  GROUP BY np.id, np.name, np.dist, np.type, np.latitude, np.longitude
  HAVING COUNT(au.id) > 0 -- Only show places with at least 1 person
  ORDER BY target_count DESC, count DESC, distance ASC;
END;
$$;

-- 3. Create get_hotspot_users function
CREATE OR REPLACE FUNCTION get_hotspot_users(place_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  age integer,
  bio text,
  body_count integer,
  tier text,
  distance_km float,
  status text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  place_lat float;
  place_long float;
BEGIN
  -- Get place coordinates
  SELECT latitude, longitude INTO place_lat, place_long
  FROM public.places
  WHERE public.places.id = place_id;

  IF place_lat IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ghost_list AS (
    -- Users who ghosted me or I ghosted
    SELECT bu.blocked_id AS ghost_id
    FROM public.blocked_users bu
    WHERE bu.blocker_id = auth.uid()
    UNION
    SELECT bu.blocker_id AS ghost_id
    FROM public.blocked_users bu
    WHERE bu.blocked_id = auth.uid()
  ),
  active_users_at_place AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.birth_date,
      p.age,
      p.bio,
      p.tier,
      p.latitude,
      p.longitude,
      (
        6371 * acos(
          least(1.0, greatest(-1.0, 
            cos(radians(place_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(place_long)) +
            sin(radians(place_lat)) * sin(radians(p.latitude))
          ))
        )
      ) AS dist
    FROM public.profiles p
    WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.last_location_update > (now() - interval '4 hours')
    AND p.id != auth.uid()
    AND p.id NOT IN (SELECT ghost_id FROM ghost_list)
  )
  SELECT 
    au.id,
    au.username,
    au.avatar_url,
    CASE 
      WHEN au.birth_date IS NOT NULL THEN 
        EXTRACT(YEAR FROM AGE(au.birth_date::date))::integer
      ELSE au.age
    END as age,
    COALESCE(au.bio, '') as bio,
    COALESCE(us.body_count, 0) as body_count,
    COALESCE(au.tier, 'FREE') as tier,
    au.dist as distance_km,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.matches m WHERE (m.user1_id = auth.uid() AND m.user2_id = au.id) OR (m.user2_id = auth.uid() AND m.user1_id = au.id)) THEN 'matched'
      WHEN EXISTS (SELECT 1 FROM public.likes l WHERE l.from_user_id = auth.uid() AND l.to_user_id = au.id) THEN 'liked'
      WHEN EXISTS (SELECT 1 FROM public.dismisses d WHERE d.from_user_id = auth.uid() AND d.to_user_id = au.id) THEN 'dismissed'
      ELSE 'target'
    END as status
  FROM active_users_at_place au
  LEFT JOIN public.user_stats us ON us.user_id = au.id
  WHERE au.dist <= 0.5 -- Within 500m of place
  ORDER BY 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.matches m WHERE (m.user1_id = auth.uid() AND m.user2_id = au.id) OR (m.user2_id = auth.uid() AND m.user1_id = au.id)) THEN 3
      WHEN EXISTS (SELECT 1 FROM public.likes l WHERE l.from_user_id = auth.uid() AND l.to_user_id = au.id) THEN 2
      WHEN EXISTS (SELECT 1 FROM public.dismisses d WHERE d.from_user_id = auth.uid() AND d.to_user_id = au.id) THEN 1
      ELSE 0
    END ASC, -- Targets first
    body_count DESC;
END;
$$;
