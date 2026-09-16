ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS profit_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS fixed_daily_profit numeric NOT NULL DEFAULT 0;

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_profit_type_check;
ALTER TABLE public.plans
  ADD CONSTRAINT plans_profit_type_check CHECK (profit_type IN ('percent','fixed'));