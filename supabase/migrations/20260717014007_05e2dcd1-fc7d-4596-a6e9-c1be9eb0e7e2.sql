CREATE OR REPLACE FUNCTION public.recent_activity(_limit integer DEFAULT 20)
RETURNS TABLE(kind text, first_name text, amount numeric, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    (SELECT 'deposit'::text AS kind,
           COALESCE(NULLIF(trim(pr.full_name), ''), 'Investor') AS first_name,
           d.amount::numeric AS amount,
           d.created_at AS created_at
      FROM public.deposits d
      LEFT JOIN public.profiles pr ON pr.id = d.user_id
      WHERE d.status IN ('approved','pending')
        AND d.created_at >= now() - interval '30 minutes'
      ORDER BY d.created_at DESC
      LIMIT LEAST(GREATEST(_limit, 1), 100))
    UNION ALL
    (SELECT 'withdraw'::text,
           COALESCE(NULLIF(trim(pr.full_name), ''), 'Investor'),
           w.amount::numeric,
           w.created_at
      FROM public.withdrawals w
      LEFT JOIN public.profiles pr ON pr.id = w.user_id
      WHERE w.status IN ('paid','approved','pending')
        AND w.created_at >= now() - interval '30 minutes'
      ORDER BY w.created_at DESC
      LIMIT LEAST(GREATEST(_limit, 1), 100))
  ) t
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$function$;