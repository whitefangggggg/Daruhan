-- Daruhan seed data — safe to re-run (uses ON CONFLICT / NOT EXISTS patterns)

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

INSERT INTO public.payment_methods (name, account_name, qr_image_url, is_active, sort_order)
SELECT v.name, v.account_name, v.qr_image_url, true, v.sort_order
FROM (VALUES
  ('GCash', 'Daruhan', NULL::text, 1),
  ('GoTyme', 'Daruhan', NULL::text, 2)
) AS v(name, account_name, qr_image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm WHERE pm.name = v.name
);

-- After first signup, promote your account:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<your-auth-user-uuid>';
