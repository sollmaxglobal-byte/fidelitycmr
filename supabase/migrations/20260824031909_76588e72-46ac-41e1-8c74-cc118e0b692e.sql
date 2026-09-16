ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS auto_state text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS auto_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_note text,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS operator_ref text;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS auto_withdraw_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_withdraw_max_amount numeric,
  ADD COLUMN IF NOT EXISTS auto_withdraw_ussd_template text NOT NULL DEFAULT '*126*9*{phone}*{amount}#';

CREATE INDEX IF NOT EXISTS withdrawals_auto_state_idx ON public.withdrawals (auto_state, status);

-- Claim the next MTN withdrawal that may be paid out automatically.
CREATE OR REPLACE FUNCTION public.claim_auto_withdrawal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  w record;
  tpl text;
  code text;
  digits text;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = 1;
  IF s IS NULL OR NOT COALESCE(s.auto_withdraw_enabled, false) THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'Automatic withdrawal is disabled');
  END IF;
  tpl := COALESCE(NULLIF(s.auto_withdraw_ussd_template, ''), '*126*9*{phone}*{amount}#');

  -- Re-queue anything dispatched more than 10 minutes ago without a result.
  UPDATE public.withdrawals
     SET auto_state = 'queued'
   WHERE auto_state = 'dispatched'
     AND status = 'pending'
     AND dispatched_at < now() - interval '10 minutes'
     AND auto_attempts < 3;

  SELECT * INTO w
    FROM public.withdrawals
   WHERE status = 'pending'
     AND auto_state = 'queued'
     AND (s.auto_withdraw_max_amount IS NULL OR amount <= s.auto_withdraw_max_amount)
   ORDER BY created_at
   FOR UPDATE SKIP LOCKED
   LIMIT 1;

  IF w IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'Nothing to pay');
  END IF;

  digits := regexp_replace(w.account_number, '[^0-9]', '', 'g');
  IF length(digits) > 9 THEN
    digits := right(digits, 9);
  END IF;

  code := replace(replace(tpl, '{phone}', digits), '{amount}', trunc(w.amount)::text);

  UPDATE public.withdrawals
     SET auto_state = 'dispatched',
         dispatched_at = now(),
         auto_attempts = auto_attempts + 1,
         auto_note = 'Sent to phone automation'
   WHERE id = w.id;

  RETURN jsonb_build_object(
    'claimed', true,
    'id', w.id,
    'phone', digits,
    'amount', trunc(w.amount),
    'account_name', w.account_name,
    'code', code
  );
END;
$$;

-- Mark an automated payout as completed (funds already held at request time).
CREATE OR REPLACE FUNCTION public.complete_auto_withdrawal(_id uuid, _ref text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w record;
BEGIN
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF w IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Withdrawal not found');
  END IF;
  IF w.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Already reviewed');
  END IF;

  UPDATE public.withdrawals
     SET status = 'paid',
         reviewed_at = now(),
         auto_state = 'sent',
         operator_ref = _ref,
         auto_note = 'Paid automatically'
   WHERE id = _id;

  INSERT INTO public.transactions (user_id, type, amount, description, ref_id)
  VALUES (w.user_id, 'withdrawal', -trunc(w.amount), 'Withdrawal paid automatically (' || w.method || ')', w.id);

  RETURN jsonb_build_object('ok', true, 'user_id', w.user_id, 'amount', trunc(w.amount));
END;
$$;

-- Mark an automated payout as failed so an admin can handle it manually.
CREATE OR REPLACE FUNCTION public.fail_auto_withdrawal(_id uuid, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.withdrawals
     SET auto_state = 'failed',
         auto_note = COALESCE(_note, 'Automatic payout failed')
   WHERE id = _id AND status = 'pending';
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_auto_withdrawal() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_auto_withdrawal(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_auto_withdrawal(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_auto_withdrawal() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_auto_withdrawal(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_auto_withdrawal(uuid, text) TO service_role;