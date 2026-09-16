CREATE OR REPLACE FUNCTION public.profiles_prevent_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.bypass_profile_guard', true) = 'on'
     OR public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_invested IS DISTINCT FROM OLD.total_invested
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.referral_earnings IS DISTINCT FROM OLD.referral_earnings
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'Cannot modify protected profile fields';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_investment(_plan_id uuid, _amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res jsonb;
BEGIN
  res := public.activate_investment_v2(_plan_id, _amount);
  RETURN (res->>'investment_id')::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_investment_v2(_plan_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cur_balance numeric;
  cur_invested numeric;
  p RECORD;
  new_inv_id uuid;
  new_tx_id uuid;
  min_a numeric;
  max_a numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO p FROM public.plans WHERE id = _plan_id AND COALESCE(active, true) = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plan not found or inactive'; END IF;

  IF COALESCE(p.amount_type, 'range') = 'fixed' THEN
    min_a := p.fixed_amount; max_a := p.fixed_amount;
  ELSE
    min_a := p.min_amount; max_a := p.max_amount;
  END IF;

  IF _amount < min_a OR _amount > max_a THEN
    RAISE EXCEPTION 'Amount must be between % and % XAF', min_a, max_a;
  END IF;

  SELECT balance, total_invested INTO cur_balance, cur_invested
    FROM public.profiles WHERE id = uid FOR UPDATE;
  IF cur_balance IS NULL OR cur_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO public.investments(user_id, plan_id, amount, daily_roi_percent, duration_days, end_date, status)
    VALUES (uid, _plan_id, _amount, COALESCE(p.daily_roi_percent, 0), p.duration_days,
            now() + (p.duration_days || ' days')::interval, 'active')
    RETURNING id INTO new_inv_id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles
    SET balance = cur_balance - _amount,
        total_invested = COALESCE(cur_invested, 0) + _amount
    WHERE id = uid;
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
    VALUES (uid, 'investment', -_amount, 'Activated ' || p.name, new_inv_id)
    RETURNING id INTO new_tx_id;

  RETURN jsonb_build_object(
    'investment_id', new_inv_id,
    'transaction_id', new_tx_id,
    'plan_name', p.name,
    'amount', _amount,
    'duration_days', p.duration_days
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_investment_v2(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_investment_v2(uuid, numeric) TO authenticated;