-- Add location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS last_location_update timestamp with time zone;

-- Create an index for faster location queries
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles (latitude, longitude);

-- Function to find active hotspots (clusters of users)
-- This is a simplified version. In a real app, you might use PostGIS for better clustering.
CREATE OR REPLACE FUNCTION get_active_hotspots(radius_km float, current_lat float, current_long float)
RETURNS TABLE (
  id uuid,
  name text,
  distance float,
  count bigint,
  label text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- For now, we will just return individual users as "hotspots" if they are close
  -- In the future, we can group them by location name (e.g. Google Places API)
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    (
      6371 * acos(
        cos(radians(current_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(current_long)) +
        sin(radians(current_lat)) * sin(radians(p.latitude))
      )
    ) AS distance,
    1::bigint as count, -- Individual user count
    'Active User'::text as label
  FROM public.profiles p
  WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.last_location_update > (now() - interval '1 hour') -- Only active in last hour
    AND (
      6371 * acos(
        cos(radians(current_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(current_long)) +
        sin(radians(current_lat)) * sin(radians(p.latitude))
      )
    ) <= radius_km
  ORDER BY distance ASC
  LIMIT 20;
END;
$$;
