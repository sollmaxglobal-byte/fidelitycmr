CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _account_name text, _account_number text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  VALUES (uid, _amount, _method::public.payment_method_type, _account_name, _account_number, 'pending')
  RETURNING id INTO new_id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET balance = cur - _amount WHERE id = uid;
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
  VALUES (uid, 'withdrawal_hold', -_amount, 'Withdrawal request submitted (funds held)', new_id);

  RETURN new_id;
END;
$function$;