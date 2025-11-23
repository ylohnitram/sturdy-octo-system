-- Oprava funkce get_active_hotspots
-- Původní verze odkazovala na neexistující sloupec 'name', mělo to být 'username'

CREATE OR REPLACE FUNCTION get_active_hotspots(radius_km float, current_lat float, current_long float)
RETURNS TABLE (
  id uuid,
  name text, -- Toto je název výstupního sloupce, to je OK
  distance float,
  count bigint,
  label text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username as name, -- OPRAVA: mapujeme username na name
    (
      6371 * acos(
        cos(radians(current_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(current_long)) +
        sin(radians(current_lat)) * sin(radians(p.latitude))
      )
    ) AS distance,
    1::bigint as count,
    'Active User'::text as label
  FROM public.profiles p
  WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.last_location_update > (now() - interval '1 hour')
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
