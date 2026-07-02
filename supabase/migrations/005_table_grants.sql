-- Grants for authenticated users to read courts + payment methods (RLS still applies)
GRANT SELECT ON TABLE public.courts TO authenticated;
GRANT SELECT ON TABLE public.payment_methods TO authenticated;
