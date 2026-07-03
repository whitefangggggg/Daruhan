-- Daruhan: KTV rooms — same booking engine as courts, flat rate, own operating hours
-- Adds courts.type ('court' | 'ktv') and makes pricing / closed-hours RPCs type-aware.
-- Run after 001-006. Seed the 9 KTV rooms + payment QR via seed.sql.

-- ── courts.type ──────────────────────────────────────────────────────────────

ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'court';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courts_type_check'
  ) THEN
    ALTER TABLE public.courts
      ADD CONSTRAINT courts_type_check CHECK (type IN ('court', 'ktv'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS courts_type_idx ON public.courts (type);

-- ── KTV flat pricing (₱100/hr, mirrors src/config/site.js SITE.ktv.ratePerHour) ─

CREATE OR REPLACE FUNCTION public.calculate_ktv_total(p_duration_hours int)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RETURN 0;
  END IF;
  RETURN 100 * p_duration_hours;
END;
$$;

-- ── Per-venue closed hours (courts: 5AM–7AM · ktv: 4AM–8AM) ──────────────────
-- Adding p_venue_type with a DEFAULT keeps existing call sites (courts) working.

CREATE OR REPLACE FUNCTION public.booking_range_has_closed_hours(
  p_start_hour int,
  p_duration_hours int,
  p_venue_type text DEFAULT 'court'
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  i int;
  h int;
  v_close_start int := CASE WHEN p_venue_type = 'ktv' THEN 4 ELSE 5 END;
  v_close_end int := CASE WHEN p_venue_type = 'ktv' THEN 8 ELSE 7 END;
BEGIN
  FOR i IN 0..(p_duration_hours - 1) LOOP
    h := (p_start_hour + i) % 24;
    IF h >= v_close_start AND h < v_close_end THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

-- ── create_booking_hold_auto — branch pricing/closed-hours/extras by court type ─
-- Signature unchanged; venue type is derived from the courts being booked so the
-- frontend calls the exact same RPC for court and KTV bookings.

CREATE OR REPLACE FUNCTION public.create_booking_hold_auto(
  p_date date,
  p_start_hour int,
  p_duration_hours int,
  p_notes text,
  p_court_ids uuid[],
  p_paddles int,
  p_balls int,
  p_trainer_hours int,
  p_trainer_heads int,
  p_contact_phone text,
  p_court_count int
)
RETURNS TABLE (
  booking_id uuid,
  court_id uuid,
  total_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_venue_type text;
  v_need int;
  v_court_id uuid;
  v_court_total numeric;
  v_extras numeric;
  v_extras_share numeric;
  v_row_total numeric;
  v_assigned int := 0;
  v_booking_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NULLIF(trim(p_contact_phone), '') IS NULL THEN
    RAISE EXCEPTION 'CONTACT_PHONE_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RAISE EXCEPTION 'INVALID_BOOKING' USING ERRCODE = '22023';
  END IF;

  IF p_court_ids IS NULL OR array_length(p_court_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_COURTS' USING ERRCODE = '22023';
  END IF;

  SELECT type INTO v_venue_type FROM public.courts WHERE id = p_court_ids[1];
  v_venue_type := COALESCE(v_venue_type, 'court');

  IF public.booking_range_has_closed_hours(p_start_hour, p_duration_hours, v_venue_type) THEN
    RAISE EXCEPTION 'INVALID_BOOKING: venue closed' USING ERRCODE = '22023';
  END IF;

  v_need := GREATEST(1, LEAST(COALESCE(p_court_count, 1), 24));
  IF v_venue_type = 'ktv' THEN
    v_court_total := public.calculate_ktv_total(p_duration_hours);
  ELSE
    v_court_total := public.calculate_court_total(p_start_hour, p_duration_hours);
  END IF;

  IF v_court_total <= 0 THEN
    RAISE EXCEPTION 'INVALID_PRICE' USING ERRCODE = '22023';
  END IF;

  IF v_venue_type = 'ktv' THEN
    v_extras := 0;
  ELSE
    v_extras := public.calculate_extras_total(p_paddles, p_balls, 0, 0, p_duration_hours);
  END IF;
  v_extras_share := CASE WHEN v_need > 0 THEN round(v_extras / v_need, 2) ELSE 0 END;

  FOREACH v_court_id IN ARRAY p_court_ids LOOP
    EXIT WHEN v_assigned >= v_need;

    IF NOT EXISTS (
      SELECT 1 FROM public.courts c
      WHERE c.id = v_court_id AND c.is_active = true AND c.type = v_venue_type
    ) THEN
      CONTINUE;
    END IF;

    IF public.booking_slot_is_taken(v_court_id, p_date, p_start_hour, p_duration_hours) THEN
      CONTINUE;
    END IF;

    v_row_total := v_court_total + v_extras_share;

    INSERT INTO public.bookings (
      user_id, court_id, date, start_hour, duration_hours,
      status, notes, contact_phone, total_price
    )
    VALUES (
      v_user_id, v_court_id, p_date, p_start_hour, p_duration_hours,
      'processing', COALESCE(p_notes, ''), trim(p_contact_phone), v_row_total
    )
    RETURNING id INTO v_booking_id;

    booking_id := v_booking_id;
    court_id := v_court_id;
    total_price := v_row_total;
    RETURN NEXT;

    v_assigned := v_assigned + 1;
  END LOOP;

  IF v_assigned = 0 THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = '23P01';
  END IF;

  IF v_assigned < v_need THEN
    -- Partial assignment is worse than none — roll back this transaction
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = '23P01';
  END IF;
END;
$$;

-- ── admin_create_reservations — same type-aware branching for admin bookings ──

CREATE OR REPLACE FUNCTION public.admin_create_reservations(
  p_start_date date,
  p_end_date date,
  p_start_hour int,
  p_duration_hours int,
  p_court_ids uuid[],
  p_booker_name text,
  p_repeat_weekly boolean,
  p_admin_notes text DEFAULT NULL,
  p_payment_collected boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_venue_type text;
  v_date date;
  v_court_id uuid;
  v_notes text;
  v_inserted int := 0;
  v_skipped int := 0;
  v_target_dow int;
  v_cursor date;
  v_effective_end date;
  v_total numeric;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF NULLIF(trim(p_booker_name), '') IS NULL THEN
    RAISE EXCEPTION 'BOOKER_NAME_REQUIRED' USING ERRCODE = '22023';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'INVALID_DATE_RANGE' USING ERRCODE = '22023';
  END IF;

  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RAISE EXCEPTION 'INVALID_DURATION' USING ERRCODE = '22023';
  END IF;

  IF p_court_ids IS NULL OR array_length(p_court_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_COURTS' USING ERRCODE = '22023';
  END IF;

  SELECT type INTO v_venue_type FROM public.courts WHERE id = p_court_ids[1];
  v_venue_type := COALESCE(v_venue_type, 'court');

  IF public.booking_range_has_closed_hours(p_start_hour, p_duration_hours, v_venue_type) THEN
    RAISE EXCEPTION 'INVALID_DURATION: venue closed' USING ERRCODE = '22023';
  END IF;

  IF v_venue_type = 'ktv' THEN
    v_total := public.calculate_ktv_total(p_duration_hours);
  ELSE
    v_total := public.calculate_court_total(p_start_hour, p_duration_hours);
  END IF;

  v_notes := 'Booked under: ' || trim(p_booker_name);
  IF NULLIF(trim(p_admin_notes), '') IS NOT NULL THEN
    v_notes := v_notes || ' · ' || trim(p_admin_notes);
  END IF;

  v_target_dow := EXTRACT(DOW FROM p_start_date)::int;
  v_effective_end := CASE WHEN p_repeat_weekly THEN p_end_date ELSE p_start_date END;
  v_cursor := p_start_date;

  WHILE v_cursor <= v_effective_end LOOP
    IF NOT p_repeat_weekly OR EXTRACT(DOW FROM v_cursor)::int = v_target_dow THEN
      FOREACH v_court_id IN ARRAY p_court_ids LOOP
        IF public.booking_slot_is_taken(v_court_id, v_cursor, p_start_hour, p_duration_hours) THEN
          v_skipped := v_skipped + 1;
          CONTINUE;
        END IF;

        INSERT INTO public.bookings (
          user_id, court_id, date, start_hour, duration_hours,
          status, notes, contact_phone, total_price,
          payment_reference, payment_collected
        )
        VALUES (
          v_admin_id, v_court_id, v_cursor, p_start_hour, p_duration_hours,
          'confirmed', v_notes, '', v_total,
          'ADMIN', p_payment_collected
        );

        v_inserted := v_inserted + 1;
      END LOOP;
    END IF;
    v_cursor := v_cursor + 1;
  END LOOP;

  IF v_inserted = 0 THEN
    RAISE EXCEPTION 'NO_SLOTS_CREATED' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('inserted', v_inserted, 'skipped', v_skipped);
END;
$$;
