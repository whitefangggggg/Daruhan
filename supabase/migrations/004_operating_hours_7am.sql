-- Daruhan: update operating hours to 7AM–5AM (closed 5AM–7AM)
-- Run in SQL Editor if you already applied migrations 001–003 with the old 8AM open time.

CREATE OR REPLACE FUNCTION public.booking_range_has_closed_hours(
  p_start_hour int,
  p_duration_hours int
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  i int;
  h int;
BEGIN
  FOR i IN 0..(p_duration_hours - 1) LOOP
    h := (p_start_hour + i) % 24;
    IF h >= 5 AND h < 7 THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;
