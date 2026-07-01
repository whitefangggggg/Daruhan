# Supabase setup — Daruhan

This folder contains SQL migrations that match the Daruhan frontend (`src/`).  
Run them on a **new Supabase project**, then point `.env.local` at it.

> **KTV** (`/ktv`) is WhatsApp-only — no database tables needed.

---

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → New project  
2. Note **Project URL** and **anon public** key (Settings → API)

---

## 2. Run migrations (SQL Editor)

In **SQL Editor**, run these files **in order** (copy/paste full contents of each):

| Order | File |
|-------|------|
| 1 | `supabase/migrations/001_schema.sql` |
| 2 | `supabase/migrations/002_functions_rls.sql` |
| 3 | `supabase/migrations/003_rpc_triggers.sql` |
| 4 | `supabase/seed.sql` |

Each file is idempotent where possible (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

---

## 3. Auth settings

**Authentication → URL configuration**

- **Site URL:** `http://localhost:5173` (dev) and your production URL  
- **Redirect URLs:** add both dev and prod origins, plus `/onboarding` if using Google OAuth

**Authentication → Providers**

- Email: on (confirm email on or off — frontend handles both)  
- Google: optional; redirect goes to `/onboarding`

---

## 4. Environment variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional for booking QR images:

```env
VITE_PAYMENT_QR_URL=https://your-cdn/gcash-qr.png
```

Upload QR images to `payment_methods.qr_image_url` in Table Editor, or set `VITE_PAYMENT_QR_URL` as a fallback.

---

## 5. Create your admin user

1. Register in the app (or create user in Supabase Auth)  
2. Copy user UUID from **Authentication → Users**  
3. SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin', onboarding_completed = true
WHERE id = 'YOUR-USER-UUID';
```

Never put the `service_role` key in the frontend.

---

## 6. What the schema includes

| Table | Purpose |
|-------|---------|
| `profiles` | Players/admins; `role = 'admin'` for dashboard |
| `courts` | 4 courts (seeded) |
| `payment_methods` | GCash / GoTyme (seeded) |
| `bookings` | Court holds, payments, admin reserves |
| `blocked_slots` | Maintenance blocks + open-play blocks |
| `notifications` | User alerts (written by DB triggers) |
| `open_play_posts` / `open_play_rsvps` | Optional (`SITE.features.openPlay`) |

| RPC | Who can call |
|-----|----------------|
| `get_court_occupancy` | Any signed-in user |
| `create_booking_hold_auto` | Any signed-in user |
| `admin_create_reservations` | Admin only |
| `refresh_booking_statuses` | Admin only |

---

## 7. RLS summary (strict)

- **Users** read/update only their own `profiles` (cannot change `role`)  
- **Users** read own `bookings`; update payment fields on `processing` holds; cancel own bookings  
- **Users** cannot `INSERT` bookings directly — only via `create_booking_hold_auto`  
- **Admins** read/update all bookings; full access to `blocked_slots` and open play  
- **Courts / payment_methods** — read-only for authenticated users  
- **Notifications** — users read/mark-read own rows only; inserts via triggers  

Helper `is_admin()` checks `profiles.role = 'admin'`.

---

## 8. Pricing (server-side)

Must match `src/lib/pricing.js`:

| Hours | Rate |
|-------|------|
| 7AM – 12MN (incl. midnight) | ₱300/hr |
| 1AM – 5AM | ₱350/hr |
| 5AM – 8AM | **closed** (rejected by RPC) |

Extras (`create_booking_hold_auto`): paddles ₱100, balls ₱100, trainer ₱300/hr/head.

---

## 9. Smoke test

- [ ] Register → sign in → `/book` → create hold  
- [ ] Submit payment reference → admin sees “paid verify”  
- [ ] Admin confirms → user gets notification  
- [ ] Admin reserve (`payment_reference = 'ADMIN'`)  
- [ ] Block slot in Manage Slots → slot unavailable in grid  
- [ ] Unpaid hold expires after 30 minutes (`refresh_booking_statuses` on admin dashboard)

---

## 10. Keeping frontend + DB in sync

When you change **court count**, **hours**, or **rates** in `src/config/site.js` / `src/lib/pricing.js`, update the SQL functions in `002_functions_rls.sql` and `003_rpc_triggers.sql` to match.
