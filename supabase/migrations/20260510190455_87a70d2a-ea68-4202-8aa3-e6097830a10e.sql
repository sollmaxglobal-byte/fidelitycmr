
-- ============ ENUM ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.payment_method_type AS ENUM ('mobile_money', 'bank_transfer', 'crypto');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'investment', 'roi', 'withdrawal', 'adjustment');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC(14,2) NOT NULL,
  max_amount NUMERIC(14,2) NOT NULL,
  daily_roi_percent NUMERIC(6,3) NOT NULL,
  duration_days INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENT METHODS ============
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.payment_method_type NOT NULL,
  label TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- ============ DEPOSITS ============
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  reference TEXT,
  proof_url TEXT,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- ============ INVESTMENTS ============
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  amount NUMERIC(14,2) NOT NULL,
  daily_roi_percent NUMERIC(6,3) NOT NULL,
  duration_days INTEGER NOT NULL,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.investment_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  last_payout_at TIMESTAMPTZ
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ============ WITHDRAWALS ============
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  method public.payment_method_type NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============ TRIGGER: auto-create profile + role ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plans
CREATE POLICY "Anyone authed reads active plans" ON public.plans
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public reads active plans" ON public.plans
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "Admins manage plans" ON public.plans
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payment_methods
CREATE POLICY "Authed reads active methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage methods" ON public.payment_methods
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- deposits
CREATE POLICY "Users view own deposits" ON public.deposits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own deposits" ON public.deposits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins update deposits" ON public.deposits
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- investments
CREATE POLICY "Users view own investments" ON public.investments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own investments" ON public.investments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update investments" ON public.investments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- withdrawals
CREATE POLICY "Users view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins update withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "Users view own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- ============ Storage bucket for proof uploads ============
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone view proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

-- ============ Seed default plans + payment methods ============
INSERT INTO public.plans (name, description, min_amount, max_amount, daily_roi_percent, duration_days) VALUES
  ('Starter', 'Begin your journey with steady daily returns.', 5000, 100000, 2.5, 15),
  ('Growth', 'Balanced plan for committed investors.', 100000, 1000000, 3.5, 25),
  ('Prestige', 'Premium tier with the highest daily ROI.', 1000000, 50000000, 4.5, 40);

INSERT INTO public.payment_methods (type, label, account_name, account_number, instructions) VALUES
  ('mobile_money', 'MTN Mobile Money', 'CAMVCC LTD', '670000000', 'Send the exact amount and use your email as the reason. Then upload the SMS confirmation as proof.'),
  ('mobile_money', 'Orange Money', 'CAMVCC LTD', '690000000', 'Send via Orange Money. Use your email as reference. Upload screenshot of confirmation.'),
  ('bank_transfer', 'Afriland First Bank', 'CAMVCC LTD', '10005-00123456789-00', 'Wire transfer to the account above. Upload bank slip as proof.'),
  ('crypto', 'USDT (TRC20)', 'Camvcc Wallet', 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Send USDT on the TRON network. Upload the transaction hash screenshot.');
