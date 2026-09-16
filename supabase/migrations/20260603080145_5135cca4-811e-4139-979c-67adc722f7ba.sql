
-- 1. Settings: referral percent
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS referral_percent numeric NOT NULL DEFAULT 5;

-- 2. Profiles: referral tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS referral_earnings numeric NOT NULL DEFAULT 0;

-- 3. Investments: suspend flag
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false;

-- 4. Transaction type enum: add new values
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'profit';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'referral';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'investment_return';

-- 5. Update handle_new_user to capture referrer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_code text;
  ref_user uuid;
BEGIN
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = upper(ref_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    ref_user
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Ensure auth trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Profit distribution function
CREATE OR REPLACE FUNCTION public.distribute_profits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
  cycle_days int;
  cycles_due int;
  daily_profit numeric;
  cycle_profit numeric;
  total_profit numeric;
  ref_user uuid;
  ref_pct numeric;
  ref_amount numeric;
  next_payout timestamptz;
  cap_ts timestamptz;
BEGIN
  SELECT COALESCE(referral_percent, 0) INTO ref_pct FROM public.app_settings WHERE id = 1;
  ref_pct := COALESCE(ref_pct, 0);

  FOR inv IN
    SELECT i.id, i.user_id, i.amount, i.daily_roi_percent, i.duration_days,
           i.start_date, i.end_date, i.last_payout_at, i.total_earned,
           p.profit_type, p.fixed_daily_profit, p.payout_frequency
    FROM public.investments i
    JOIN public.plans p ON p.id = i.plan_id
    WHERE i.status = 'active' AND COALESCE(i.is_paused, false) = false
  LOOP
    cycle_days := CASE inv.payout_frequency
      WHEN 'daily' THEN 1
      WHEN 'weekly' THEN 7
      WHEN 'monthly' THEN 30
      ELSE inv.duration_days
    END;

    daily_profit := CASE WHEN inv.profit_type = 'fixed'
                         THEN COALESCE(inv.fixed_daily_profit, 0)
                         ELSE inv.amount * COALESCE(inv.daily_roi_percent, 0) / 100 END;
    cycle_profit := daily_profit * cycle_days;

    cap_ts := LEAST(now(), inv.end_date);
    next_payout := COALESCE(inv.last_payout_at, inv.start_date) + (cycle_days || ' days')::interval;
    cycles_due := 0;
    WHILE next_payout <= cap_ts LOOP
      cycles_due := cycles_due + 1;
      next_payout := next_payout + (cycle_days || ' days')::interval;
    END LOOP;

    IF cycles_due > 0 AND cycle_profit > 0 THEN
      total_profit := cycle_profit * cycles_due;
      UPDATE public.profiles
        SET balance = balance + total_profit,
            total_earned = total_earned + total_profit
        WHERE id = inv.user_id;
      INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
        VALUES (inv.user_id, 'profit', total_profit, 'Auto profit payout', inv.id);
      UPDATE public.investments
        SET total_earned = total_earned + total_profit,
            last_payout_at = COALESCE(last_payout_at, start_date) + (cycles_due * cycle_days || ' days')::interval
        WHERE id = inv.id;

      SELECT referred_by INTO ref_user FROM public.profiles WHERE id = inv.user_id;
      IF ref_user IS NOT NULL AND ref_pct > 0 THEN
        ref_amount := total_profit * ref_pct / 100;
        UPDATE public.profiles
          SET balance = balance + ref_amount,
              referral_earnings = COALESCE(referral_earnings, 0) + ref_amount
          WHERE id = ref_user;
        INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
          VALUES (ref_user, 'referral', ref_amount, 'Referral commission', inv.id);
      END IF;
    END IF;

    -- Complete & return capital if past end date
    IF now() >= inv.end_date THEN
      UPDATE public.profiles SET balance = balance + inv.amount WHERE id = inv.user_id;
      INSERT INTO public.transactions(user_id, type, amount, description, ref_id)
        VALUES (inv.user_id, 'investment_return', inv.amount, 'Capital returned at end of term', inv.id);
      UPDATE public.investments SET status = 'completed' WHERE id = inv.id;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_profits() TO service_role;

-- 7. Schedule cron (hourly)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('distribute-profits-hourly');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'distribute-profits-hourly',
  '0 * * * *',
  $cron$ SELECT public.distribute_profits(); $cron$
);
