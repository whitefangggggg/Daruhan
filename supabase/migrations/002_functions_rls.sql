-- Daruhan: helper functions, auth bootstrap, RLS policies

-- ── Helpers ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Mirror src/lib/pricing.js getRateForHour + calculateTotal
CREATE OR REPLACE FUNCTION public.get_rate_for_hour(p_hour int)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_hour >= 1 AND p_hour <= 5 THEN
    RETURN 350;
  END IF;
  RETURN 300;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_court_total(p_start_hour int, p_duration_hours int)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  total numeric := 0;
  i int;
  h int;
BEGIN
  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RETURN 0;
  END IF;
  FOR i IN 0..(p_duration_hours - 1) LOOP
    h := (p_start_hour + i) % 24;
    total := total + public.get_rate_for_hour(h);
  END LOOP;
  RETURN total;
END;
$$;

-- Mirror src/utils/parseBookingNotes.js extras (₱50/hr paddle & ball)
CREATE OR REPLACE FUNCTION public.calculate_extras_total(
  p_paddles int,
  p_balls int,
  p_trainer_hours int,
  p_trainer_heads int,
  p_duration_hours int DEFAULT 1
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_duration int := GREATEST(COALESCE(p_duration_hours, 1), 1);
BEGIN
  RETURN
    (CASE WHEN COALESCE(p_paddles, 0) > 0 THEN 50 * v_duration ELSE 0 END)
    + (CASE WHEN COALESCE(p_balls, 0) > 0 THEN 50 * v_duration ELSE 0 END);
END;
$$;

CREATE OR REPLACE FUNCTION public.hours_overlap(
  p_start1 int,
  p_dur1 int,
  p_start2 int,
  p_dur2 int
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_start1 < (p_start2 + p_dur2) AND p_start2 < (p_start1 + p_dur1);
$$;

-- Venue closed 5AM–7AM (SITE.venue.operatingHours: open 7, close 5)
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

CREATE OR REPLACE FUNCTION public.booking_slot_is_taken(
  p_court_id uuid,
  p_date date,
  p_start_hour int,
  p_duration_hours int,
  p_ignore_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.court_id = p_court_id
      AND b.date = p_date
      AND b.status IN ('processing', 'confirmed')
      AND (p_ignore_booking_id IS NULL OR b.id <> p_ignore_booking_id)
      AND (
        b.status <> 'processing'
        OR b.payment_reference IS NOT NULL
        OR b.created_at > now() - interval '30 minutes'
      )
      AND public.hours_overlap(b.start_hour, b.duration_hours, p_start_hour, p_duration_hours)
  )
  OR EXISTS (
    SELECT 1
    FROM public.blocked_slots s
    WHERE s.court_id = p_court_id
      AND s.date = p_date
      AND public.hours_overlap(s.start_hour, s.duration_hours, p_start_hour, p_duration_hours)
  );
$$;

-- Prevent non-admins from escalating role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- Auto-create profile on signup (email + Google)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
      split_part(COALESCE(NEW.email, 'player'), '@', 1)
    ),
    false,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_play_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_play_rsvps ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── courts & payment_methods (read-only for clients) ─────────────────────────

DROP POLICY IF EXISTS courts_select ON public.courts;
CREATE POLICY courts_select ON public.courts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS payment_methods_select ON public.payment_methods;
CREATE POLICY payment_methods_select ON public.payment_methods
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Table-level grants (RLS policies alone are not enough)
GRANT SELECT ON TABLE public.courts TO authenticated;
GRANT SELECT ON TABLE public.payment_methods TO authenticated;

-- ── bookings ───────────────────────────────────────────────────────────────────
-- Inserts only via SECURITY DEFINER RPCs (no INSERT policy for authenticated)

DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS bookings_update_payment ON public.bookings;
CREATE POLICY bookings_update_payment ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'processing'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'processing'
  );

DROP POLICY IF EXISTS bookings_update_cancel ON public.bookings;
CREATE POLICY bookings_update_cancel ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('processing', 'confirmed')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'cancelled'
  );

DROP POLICY IF EXISTS bookings_admin_update ON public.bookings;
CREATE POLICY bookings_admin_update ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── blocked_slots (admin only) ─────────────────────────────────────────────────

DROP POLICY IF EXISTS blocked_slots_admin_all ON public.blocked_slots;
CREATE POLICY blocked_slots_admin_all ON public.blocked_slots
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── notifications ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── open play ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS open_play_posts_select ON public.open_play_posts;
CREATE POLICY open_play_posts_select ON public.open_play_posts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS open_play_posts_admin_write ON public.open_play_posts;
CREATE POLICY open_play_posts_admin_write ON public.open_play_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS open_play_posts_admin_update ON public.open_play_posts;
CREATE POLICY open_play_posts_admin_update ON public.open_play_posts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS open_play_rsvps_select ON public.open_play_rsvps;
CREATE POLICY open_play_rsvps_select ON public.open_play_rsvps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS open_play_rsvps_insert ON public.open_play_rsvps;
CREATE POLICY open_play_rsvps_insert ON public.open_play_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS open_play_rsvps_delete ON public.open_play_rsvps;
CREATE POLICY open_play_rsvps_delete ON public.open_play_rsvps
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Booking column guard (non-admin) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_booking_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.court_id IS DISTINCT FROM OLD.court_id
     OR NEW.date IS DISTINCT FROM OLD.date
     OR NEW.start_hour IS DISTINCT FROM OLD.start_hour
     OR NEW.duration_hours IS DISTINCT FROM OLD.duration_hours
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
     OR NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.payment_collected IS DISTINCT FROM OLD.payment_collected
  THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF OLD.status NOT IN ('processing', 'confirmed') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'processing' AND NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'processing' AND NEW.status = 'processing' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_user_update_trigger ON public.bookings;
CREATE TRIGGER protect_booking_user_update_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_booking_user_update();
