ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'withdrawal_hold';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'withdrawal_refund';

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _account_name text, _account_number text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cur numeric;
  new_id uuid;
  clean_name text := trim(COALESCE(_account_name, ''));
  clean_number text := trim(COALESCE(_account_number, ''));
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 250 THEN RAISE EXCEPTION 'Minimum withdrawal is 250 XAF'; END IF;
  IF _amount <> trunc(_amount) THEN RAISE EXCEPTION 'Withdrawal amount must be a whole number'; END IF;
  IF _method NOT IN ('mobile_money','bank_transfer','crypto') THEN RAISE EXCEPTION 'Invalid method'; END IF;
  IF length(clean_name) < 2 OR length(clean_name) > 120 THEN RAISE EXCEPTION 'Enter a valid account name'; END IF;
  IF length(clean_number) < 4 OR length(clean_number) > 120 THEN RAISE EXCEPTION 'Enter a valid account number'; END IF;

  SELECT balance INTO cur FROM public.profiles WHERE id = uid FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'Account profile not found'; END IF;
  IF cur < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  INSERT INTO public.withdrawals(user_id, amount, method, account_name, account_number, status)
  VALUES (uid, _amount, _method::public.payment_method_type, clean_name, clean_number, 'pending')
  RETURNING id INTO new_id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = balance - _amount WHERE id = uid;

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (uid, 'withdrawal_hold'::public.transaction_type, -_amount, 'Withdrawal request submitted (funds held)', new_id);

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.withdrawals%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Only pending withdrawals can be rejected'; END IF;

  UPDATE public.withdrawals SET status = 'rejected', reviewed_at = now() WHERE id = _id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = balance + w.amount WHERE id = w.user_id;

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (w.user_id, 'withdrawal_refund'::public.transaction_type, w.amount, 'Withdrawal rejected — funds returned', w.id);
END;
$$;

REVOKE ALL ON FUNCTION public.reject_withdrawal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid) TO authenticated, service_role;