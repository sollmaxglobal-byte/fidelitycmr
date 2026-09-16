REVOKE ALL ON FUNCTION public.distribute_profits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_investment(uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.activate_investment_v2(uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_app_settings_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_referrals() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_prevent_privileged_updates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_receipt_email() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_investment(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_investment_v2(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_settings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_referrals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_profits() TO service_role;
GRANT EXECUTE ON FUNCTION public.recent_activity(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referrer_name(text) TO anon, authenticated;