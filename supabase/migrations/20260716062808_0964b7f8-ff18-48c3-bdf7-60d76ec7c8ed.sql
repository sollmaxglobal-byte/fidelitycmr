
CREATE OR REPLACE FUNCTION public.recent_activity(_limit int DEFAULT 20)
RETURNS TABLE(kind text, first_name text, amount numeric, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    (SELECT 'deposit'::text AS kind,
           COALESCE(split_part(NULLIF(pr.full_name, ''), ' ', 1), 'Investor') AS first_name,
           d.amount::numeric AS amount,
           d.created_at AS created_at
      FROM public.deposits d
      LEFT JOIN public.profiles pr ON pr.id = d.user_id
      WHERE d.status IN ('approved','pending')
      ORDER BY d.created_at DESC
      LIMIT _limit)
    UNION ALL
    (SELECT 'withdraw'::text,
           COALESCE(split_part(NULLIF(pr.full_name, ''), ' ', 1), 'Investor'),
           w.amount::numeric,
           w.created_at
      FROM public.withdrawals w
      LEFT JOIN public.profiles pr ON pr.id = w.user_id
      WHERE w.status IN ('paid','approved','pending')
      ORDER BY w.created_at DESC
      LIMIT _limit)
  ) t
  ORDER BY created_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.recent_activity(int) TO anon, authenticated;
