-- Daruhan seed data — safe to re-run (uses NOT EXISTS / UPDATE patterns)

INSERT INTO public.courts (name, is_active)
SELECT v.name, true
FROM (VALUES
  ('Court 1'),
  ('Court 2'),
  ('Court 3'),
  ('Court 4')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.courts c WHERE c.name = v.name
);

-- Single payment rail: QR PH (InstaPay / PESONet — low fees)
UPDATE public.payment_methods
SET is_active = false
WHERE name IN ('GCash', 'GoTyme');

INSERT INTO public.payment_methods (name, account_name, qr_image_url, is_active, sort_order)
SELECT v.name, v.account_name, v.qr_image_url, true, v.sort_order
FROM (VALUES
  ('QR PH', 'Daruhan', NULL::text, 1)
) AS v(name, account_name, qr_image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm WHERE pm.name = v.name
);

-- Optional: set your static merchant QR after seeding:
-- UPDATE public.payment_methods
-- SET qr_image_url = 'https://your-cdn/daruhan-qrph.png'
-- WHERE name = 'QR PH';

-- After first signup, promote your account:
-- UPDATE public.profiles SET role = 'admin', onboarding_completed = true WHERE id = '<your-auth-user-uuid>';
