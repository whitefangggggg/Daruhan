-- Daruhan: core schema (matches frontend in src/)
-- Run in order: 001 → 002 → 003, then seed.sql

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Profiles (extends auth.users) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  address text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- ── Courts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courts_active_idx ON public.courts (is_active) WHERE is_active = true;

-- ── Payment methods ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_name text NOT NULL DEFAULT '',
  qr_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES public.courts (id) ON DELETE RESTRICT,
  date date NOT NULL,
  start_hour smallint NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  duration_hours smallint NOT NULL CHECK (duration_hours >= 1 AND duration_hours <= 24),
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'confirmed', 'cancelled', 'completed')),
  notes text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  payment_reference text,
  payment_sender_name text,
  payment_sender_platform text,
  payment_method_id uuid REFERENCES public.payment_methods (id) ON DELETE SET NULL,
  payment_collected boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON public.bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings (date, start_hour);
CREATE INDEX IF NOT EXISTS bookings_court_date_idx ON public.bookings (court_id, date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);

-- ── Blocked slots (admin maintenance + open play) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts (id) ON DELETE CASCADE,
  date date NOT NULL,
  start_hour smallint NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  duration_hours smallint NOT NULL CHECK (duration_hours >= 1 AND duration_hours <= 24),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blocked_slots_court_date_idx ON public.blocked_slots (court_id, date);

-- ── Notifications (inserted by triggers; users read/update read_at only) ─────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN (
    'booking_confirmed',
    'booking_cancelled',
    'booking_completed',
    'payment_submitted'
  )),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

-- ── Open play (optional; SITE.features.openPlay) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.open_play_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts (id) ON DELETE RESTRICT,
  date date NOT NULL,
  start_hour smallint NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour smallint NOT NULL CHECK (end_hour >= 1 AND end_hour <= 24),
  rsvp_deadline timestamptz NOT NULL,
  skill_level text,
  title text,
  body text,
  rsvp_link text NOT NULL,
  published_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  status text CHECK (status IN ('cancelled', 'completed')),
  blocked_slot_id uuid REFERENCES public.blocked_slots (id) ON DELETE SET NULL,
  attendance int CHECK (attendance IS NULL OR attendance >= 0),
  revenue numeric(10, 2) CHECK (revenue IS NULL OR revenue >= 0),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_hour > start_hour)
);

CREATE INDEX IF NOT EXISTS open_play_posts_date_idx ON public.open_play_posts (date);

CREATE TABLE IF NOT EXISTS public.open_play_rsvps (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.open_play_posts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
