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

-- Payment: GCash only (QR image in Supabase Storage payment-assets bucket).
UPDATE public.payment_methods
SET is_active = false
WHERE name IN ('QR PH', 'GoTyme');

INSERT INTO public.payment_methods (name, account_name, qr_image_url, is_active, sort_order)
SELECT v.name, v.account_name, v.qr_image_url, true, v.sort_order
FROM (VALUES
  (
    'GCash',
    'Ellen A.',
    'https://pvjvpbffrcrdwqxewuxa.supabase.co/storage/v1/object/public/payment-assets/Daruhan_Gcash.jpg'::text,
    1
  )
) AS v(name, account_name, qr_image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm WHERE pm.name = v.name
);

UPDATE public.payment_methods
SET
  account_name = 'Ellen A.',
  qr_image_url = 'https://pvjvpbffrcrdwqxewuxa.supabase.co/storage/v1/object/public/payment-assets/Daruhan_Gcash.jpg',
  is_active = true,
  sort_order = 1
WHERE name = 'GCash';

UPDATE public.payment_methods
SET is_active = false
WHERE name = 'QR PH';

-- After first signup, promote your account:
-- UPDATE public.profiles SET role = 'admin', onboarding_completed = true WHERE id = '<your-auth-user-uuid>';
