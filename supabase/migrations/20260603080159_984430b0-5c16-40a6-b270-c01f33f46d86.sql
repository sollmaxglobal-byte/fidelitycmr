REVOKE ALL ON FUNCTION public.distribute_profits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_profits() TO service_role;