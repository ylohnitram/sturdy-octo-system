-- Migration: Create places table and update hotspot logic
-- Description: Create database of known locations (clubs, bars, parks) and aggregate users into these hotspots.

-- 0. Cleanup (for re-running migration)
DROP TABLE IF EXISTS public.places CASCADE;
DROP FUNCTION IF EXISTS get_active_hotspots(float, float, float);

-- 1. Create places table
CREATE TABLE IF NOT EXISTS public.places (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    latitude float NOT NULL,
    longitude float NOT NULL,
    type text DEFAULT 'bar', -- bar, club, park, gym, cafe, other
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Public read, Admin write - for now anyone can read)
CREATE POLICY "Anyone can read places" ON public.places FOR SELECT USING (true);

-- 4. Seed Data (Prague Hotspots)
INSERT INTO public.places (name, latitude, longitude, type) VALUES
-- Clubs
('Duplex', 50.0835, 14.4283, 'club'),
('Cross Club', 50.1086, 14.4433, 'club'),
('Epic', 50.0892, 14.4286, 'club'),
('Karlovy Lázně', 50.0861, 14.4139, 'club'),
('Lucerna Music Bar', 50.0811, 14.4262, 'club'),
('Roxy', 50.0906, 14.4260, 'club'),
('Chapeau Rouge', 50.0879, 14.4244, 'club'),
('Sasazu', 50.0991, 14.4463, 'club'),
('Fuchs2', 50.0955, 14.4335, 'club'),
('Ankali', 50.0683, 14.4563, 'club'),
('Moon Club', 50.0901, 14.4248, 'club'),
('Goldfingers', 50.0833, 14.4280, 'club'),
('One Club', 50.0848, 14.4227, 'club'),
('M1 Lounge', 50.0898, 14.4235, 'club'),

-- Bars
('Dlouhá Street', 50.0908, 14.4256, 'bar'),
('James Dean', 50.0898, 14.4238, 'bar'),
('Harley''s', 50.0902, 14.4242, 'bar'),
('Hemingway Bar', 50.0841, 14.4139, 'bar'),
('Black Angel''s', 50.0872, 14.4211, 'bar'),
('Bukowski''s', 50.0845, 14.4496, 'bar'),
('Cobra', 50.0995, 14.4305, 'bar'),
('Vzorkovna', 50.0822, 14.4186, 'bar'),
('Popocafepetl', 50.0830, 14.4140, 'bar'),
('U Sudu', 50.0796, 14.4225, 'bar'),
('Groove Bar', 50.0828, 14.4178, 'bar'),
('Public Interest', 50.0915, 14.4205, 'bar'),

-- Outdoor / Parks
('Náplavka', 50.0713, 14.4136, 'outdoor'),
('Riegrovy Sady', 50.0806, 14.4437, 'park'),
('Letná (Stalin)', 50.0949, 14.4159, 'outdoor'),
('Letná Beer Garden', 50.0964, 14.4269, 'park'),
('Václavák', 50.0812, 14.4296, 'outdoor'),
('Staromák', 50.0875, 14.4213, 'outdoor'),
('Žluté lázně', 50.0458, 14.4137, 'outdoor'),
('Stromovka', 50.1054, 14.4155, 'park'),
('Grébovka', 50.0695, 14.4459, 'park'),
('Vyšehrad', 50.0644, 14.4179, 'park'),
('Parukářka', 50.0853, 14.4619, 'park'),
('Kampa', 50.0844, 14.4086, 'park'),
('Petřín', 50.0833, 14.3958, 'park'),

-- Other
('Palladium', 50.0892, 14.4294, 'mall'),
('Nový Smíchov', 50.0721, 14.4036, 'mall'),
('Chodov', 50.0315, 14.4909, 'mall'),
('Manifesto Anděl', 50.0692, 14.4045, 'food'),
('Vnitroblock', 50.1028, 14.4513, 'cafe');

-- 5. Update get_active_hotspots function to aggregate users
CREATE OR REPLACE FUNCTION get_active_hotspots(radius_km float, current_lat float, current_long float)
RETURNS TABLE (
  id uuid,
  name text,
  distance float,
  count bigint,
  label text,
  latitude float,
  longitude float
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH active_users AS (
    SELECT p.latitude, p.longitude
    FROM public.profiles p
    WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.last_location_update > (now() - interval '4 hours') -- Active in last 4 hours
    AND p.id != auth.uid() -- Don't count myself
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
    COUNT(au.*) as count,
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
  ) <= 0.5 -- User is within 500m of the place (generous radius for aggregation)
  WHERE np.dist <= radius_km
  GROUP BY np.id, np.name, np.dist, np.type, np.latitude, np.longitude
  HAVING COUNT(au.*) > 0 -- Only show places with at least 1 person
  ORDER BY count DESC, distance ASC;
END;
$$;
