-- Daruhan: RPCs, triggers, grants
-- Pricing must stay in sync with src/lib/pricing.js and src/utils/parseBookingNotes.js

-- ── Notifications (SECURITY DEFINER — bypass RLS) ────────────────────────────

CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id uuid,
  p_booking_id uuid,
  p_type text,
  p_title text,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, booking_id, type, title, body)
  VALUES (p_user_id, p_booking_id, p_type, p_title, p_body);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'confirmed' THEN
        PERFORM public.insert_notification(
          NEW.user_id, NEW.id, 'booking_confirmed',
          'Booking confirmed',
          'Your court booking has been confirmed. See you on the court!'
        );
      ELSIF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        PERFORM public.insert_notification(
          NEW.user_id, NEW.id, 'booking_cancelled',
          'Booking cancelled',
          'Your booking was cancelled.'
        );
      ELSIF NEW.status = 'completed' THEN
        PERFORM public.insert_notification(
          NEW.user_id, NEW.id, 'booking_completed',
          'Session complete',
          'Thanks for playing! Your court session is marked complete.'
        );
      END IF;
    END IF;

    IF NEW.payment_reference IS NOT NULL
       AND OLD.payment_reference IS NULL
       AND NEW.status = 'processing' THEN
      PERFORM public.insert_notification(
        NEW.user_id, NEW.id, 'payment_submitted',
        'Payment submitted',
        'We received your payment reference. Staff will verify and confirm your booking.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_trigger ON public.bookings;
CREATE TRIGGER bookings_notify_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_change();

-- ── Open play ↔ blocked_slots sync ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_open_play_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
  v_duration int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_duration := NEW.end_hour - NEW.start_hour;
    v_reason := 'Open Play: ' || COALESCE(NULLIF(trim(NEW.title), ''), 'Session');
    INSERT INTO public.blocked_slots (court_id, date, start_hour, duration_hours, reason)
    VALUES (NEW.court_id, NEW.date, NEW.start_hour, v_duration, v_reason)
    RETURNING id INTO NEW.blocked_slot_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
      IF OLD.blocked_slot_id IS NOT NULL THEN
        DELETE FROM public.blocked_slots WHERE id = OLD.blocked_slot_id;
      END IF;
      NEW.blocked_slot_id := NULL;
      RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM 'cancelled'
       AND (
         NEW.court_id IS DISTINCT FROM OLD.court_id
         OR NEW.date IS DISTINCT FROM OLD.date
         OR NEW.start_hour IS DISTINCT FROM OLD.start_hour
         OR NEW.end_hour IS DISTINCT FROM OLD.end_hour
       ) THEN
      v_duration := NEW.end_hour - NEW.start_hour;
      v_reason := 'Open Play: ' || COALESCE(NULLIF(trim(NEW.title), ''), 'Session');
      IF NEW.blocked_slot_id IS NOT NULL THEN
        UPDATE public.blocked_slots
        SET court_id = NEW.court_id,
            date = NEW.date,
            start_hour = NEW.start_hour,
            duration_hours = v_duration,
            reason = v_reason
        WHERE id = NEW.blocked_slot_id;
      ELSE
        INSERT INTO public.blocked_slots (court_id, date, start_hour, duration_hours, reason)
        VALUES (NEW.court_id, NEW.date, NEW.start_hour, v_duration, v_reason)
        RETURNING id INTO NEW.blocked_slot_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS open_play_sync_block_insert ON public.open_play_posts;
CREATE TRIGGER open_play_sync_block_insert
  BEFORE INSERT ON public.open_play_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_open_play_block();

DROP TRIGGER IF EXISTS open_play_sync_block_update ON public.open_play_posts;
CREATE TRIGGER open_play_sync_block_update
  BEFORE UPDATE ON public.open_play_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_open_play_block();

-- ── get_court_occupancy ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_court_occupancy(
  p_date date,
  p_court_ids uuid[]
)
RETURNS TABLE (
  court_id uuid,
  start_hour int,
  duration_hours int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.court_id, b.start_hour::int, b.duration_hours::int
  FROM public.bookings b
  WHERE b.date = p_date
    AND b.court_id = ANY (p_court_ids)
    AND b.status IN ('processing', 'confirmed')
    AND (
      b.status <> 'processing'
      OR b.payment_reference IS NOT NULL
      OR b.created_at > now() - interval '30 minutes'
    )

  UNION ALL

  SELECT s.court_id, s.start_hour::int, s.duration_hours::int
  FROM public.blocked_slots s
  WHERE s.date = p_date
    AND s.court_id = ANY (p_court_ids);
$$;

REVOKE ALL ON FUNCTION public.get_court_occupancy(date, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_court_occupancy(date, uuid[]) TO authenticated;

-- ── create_booking_hold_auto ─────────────────────────────────────────────────

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
  v_need int;
  v_court_id uuid;
  v_court_total numeric;
  v_extras numeric;
  v_extras_share numeric;
  v_row_total numeric;
  v_assigned int := 0;
  v_booking_id uuid;
  i int;
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

  IF public.booking_range_has_closed_hours(p_start_hour, p_duration_hours) THEN
    RAISE EXCEPTION 'INVALID_BOOKING: venue closed 5AM–7AM' USING ERRCODE = '22023';
  END IF;

  v_need := GREATEST(1, LEAST(COALESCE(p_court_count, 1), 4));
  IF p_court_ids IS NULL OR array_length(p_court_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'NO_COURTS' USING ERRCODE = '22023';
  END IF;

  v_court_total := public.calculate_court_total(p_start_hour, p_duration_hours);
  IF v_court_total <= 0 THEN
    RAISE EXCEPTION 'INVALID_PRICE' USING ERRCODE = '22023';
  END IF;

  v_extras := public.calculate_extras_total(p_paddles, p_balls, 0, 0, p_duration_hours);
  v_extras_share := CASE WHEN v_need > 0 THEN round(v_extras / v_need, 2) ELSE 0 END;

  FOREACH v_court_id IN ARRAY p_court_ids LOOP
    EXIT WHEN v_assigned >= v_need;

    IF NOT EXISTS (
      SELECT 1 FROM public.courts c
      WHERE c.id = v_court_id AND c.is_active = true
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

REVOKE ALL ON FUNCTION public.create_booking_hold_auto(
  date, int, int, text, uuid[], int, int, int, int, text, int
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_hold_auto(
  date, int, int, text, uuid[], int, int, int, int, text, int
) TO authenticated;

-- ── admin_create_reservations ────────────────────────────────────────────────

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

  IF public.booking_range_has_closed_hours(p_start_hour, p_duration_hours) THEN
    RAISE EXCEPTION 'INVALID_DURATION: venue closed 5AM–7AM' USING ERRCODE = '22023';
  END IF;

  v_total := public.calculate_court_total(p_start_hour, p_duration_hours);
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

REVOKE ALL ON FUNCTION public.admin_create_reservations(
  date, date, int, int, uuid[], text, boolean, text, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_reservations(
  date, date, int, int, uuid[], text, boolean, text, boolean
) TO authenticated;

-- ── refresh_booking_statuses ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_booking_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  -- Expire unpaid 30-minute holds
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status = 'processing'
    AND payment_reference IS NULL
    AND created_at <= now() - interval '30 minutes';

  -- Complete sessions that have ended (Asia/Manila wall clock)
  UPDATE public.bookings
  SET status = 'completed'
  WHERE status = 'confirmed'
    AND (
      (date::timestamp + (start_hour + duration_hours) * interval '1 hour')
      AT TIME ZONE 'Asia/Manila'
    ) <= (now() AT TIME ZONE 'Asia/Manila');
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_booking_statuses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_booking_statuses() TO authenticated;
