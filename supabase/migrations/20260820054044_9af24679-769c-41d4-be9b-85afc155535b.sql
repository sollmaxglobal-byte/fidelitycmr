ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS announcement_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS announcement_title text,
  ADD COLUMN IF NOT EXISTS announcement_message text,
  ADD COLUMN IF NOT EXISTS announcement_link text,
  ADD COLUMN IF NOT EXISTS announcement_link_label text,
  ADD COLUMN IF NOT EXISTS announcement_version integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.my_referrals()
RETURNS TABLE(user_id uuid, full_name text, joined_at timestamptz, plan_name text, invested numeric, investment_status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         COALESCE(NULLIF(trim(p.full_name), ''), 'Investor'),
         p.created_at,
         pl.name,
         i.amount,
         i.status::text
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT iv.amount, iv.status, iv.plan_id
    FROM public.investments iv
    WHERE iv.user_id = p.id
    ORDER BY (iv.status = 'active') DESC, iv.start_date DESC
    LIMIT 1
  ) i ON true
  LEFT JOIN public.plans pl ON pl.id = i.plan_id
  WHERE p.referred_by = auth.uid()
  ORDER BY p.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.my_referrals() FROM public;
GRANT EXECUTE ON FUNCTION public.my_referrals() TO authenticated;