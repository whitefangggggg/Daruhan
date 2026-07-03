-- Daruhan seed data — safe to re-run (uses NOT EXISTS / UPDATE patterns)

INSERT INTO public.courts (name, is_active, type)
SELECT v.name, true, 'court'
FROM (VALUES
  ('Court 1'),
  ('Court 2'),
  ('Court 3'),
  ('Court 4')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.courts c WHERE c.name = v.name
);

-- 9 KTV rooms — auto-assigned, no room picking (see BookKtv.jsx)
INSERT INTO public.courts (name, is_active, type)
SELECT v.name, true, 'ktv'
FROM (VALUES
  ('KTV Room 1'), ('KTV Room 2'), ('KTV Room 3'),
  ('KTV Room 4'), ('KTV Room 5'), ('KTV Room 6'),
  ('KTV Room 7'), ('KTV Room 8'), ('KTV Room 9')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.courts c WHERE c.name = v.name
);

-- Single payment rail: QR PH (InstaPay / PESONet — low fees), shared by
-- court and KTV bookings alike.
UPDATE public.payment_methods
SET is_active = false
WHERE name IN ('GCash', 'GoTyme');

INSERT INTO public.payment_methods (name, account_name, qr_image_url, is_active, sort_order)
SELECT v.name, v.account_name, v.qr_image_url, true, v.sort_order
FROM (VALUES
  (
    'QR PH',
    'Daruhan Skirmish Cebu',
    'https://pvjvpbffrcrdwqxewuxa.supabase.co/storage/v1/object/public/payment-assets/Daruhan_QRPH.jpg'::text,
    1
  )
) AS v(name, account_name, qr_image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm WHERE pm.name = v.name
);

-- Keep the merchant QR + account name current even if the row already existed.
UPDATE public.payment_methods
SET account_name = 'Daruhan Skirmish Cebu',
    qr_image_url = 'https://pvjvpbffrcrdwqxewuxa.supabase.co/storage/v1/object/public/payment-assets/Daruhan_QRPH.jpg'
WHERE name = 'QR PH';

-- After first signup, promote your account:
-- UPDATE public.profiles SET role = 'admin', onboarding_completed = true WHERE id = '<your-auth-user-uuid>';
