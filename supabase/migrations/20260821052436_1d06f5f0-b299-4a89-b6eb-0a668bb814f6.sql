-- 1. Withdrawal hold + refund
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
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 250 THEN RAISE EXCEPTION 'Minimum withdrawal is 250 XAF'; END IF;
  IF _method NOT IN ('mobile_money','bank_transfer','crypto') THEN RAISE EXCEPTION 'Invalid method'; END IF;

  SELECT balance INTO cur FROM public.profiles WHERE id = uid FOR UPDATE;
  IF cur IS NULL OR cur < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  INSERT INTO public.withdrawals(user_id, amount, method, account_name, account_number, status)
  VALUES (uid, _amount, _method, _account_name, _account_number, 'pending')
  RETURNING id INTO new_id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = cur - _amount WHERE id = uid;
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (uid, 'withdrawal_hold', -_amount, 'Withdrawal request submitted (funds held)', new_id);

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Only pending withdrawals can be rejected'; END IF;

  UPDATE public.withdrawals SET status = 'rejected', reviewed_at = now() WHERE id = _id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = balance + w.amount WHERE id = w.user_id;
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (w.user_id, 'withdrawal_refund', w.amount, 'Withdrawal rejected — funds returned', w.id);
END;
$$;

REVOKE ALL ON FUNCTION public.reject_withdrawal(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid) TO authenticated;

-- 2. Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view push subscriptions"
ON public.push_subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Admin broadcasts
CREATE TABLE public.push_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  created_by uuid,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.push_broadcasts TO authenticated;
GRANT ALL ON public.push_broadcasts TO service_role;
ALTER TABLE public.push_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read broadcasts"
ON public.push_broadcasts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create broadcasts"
ON public.push_broadcasts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));