-- Paddle/ball extras: ₱50/hr (no trainer). Pass booking duration into extras calc.

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

  v_extras := public.calculate_extras_total(
    p_paddles, p_balls, 0, 0, p_duration_hours
  );
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
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = '23P01';
  END IF;
END;
$$;
