REVOKE ALL ON public.mm_messages FROM anon;
REVOKE ALL ON public.mm_messages FROM authenticated;
GRANT SELECT ON public.mm_messages TO authenticated;
GRANT ALL ON public.mm_messages TO service_role;