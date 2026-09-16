DO $$
DECLARE inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.investments WHERE id = '55f0a81c-fcfa-4e04-82b3-af01068932a5';
  IF FOUND THEN
    PERFORM set_config('app.bypass_profile_guard', 'on', true);
    UPDATE public.profiles SET balance = balance + inv.amount WHERE id = inv.user_id;
    DELETE FROM public.transactions WHERE ref_id = inv.id;
    DELETE FROM public.investments WHERE id = inv.id;
  END IF;
END $$;