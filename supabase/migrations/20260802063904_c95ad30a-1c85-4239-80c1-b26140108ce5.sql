ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'both';
ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_scope_check;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_scope_check CHECK (scope IN ('deposit','withdrawal','both'));
UPDATE public.app_settings SET site_url = 'https://fidelity-invest.lovable.app' WHERE id = 1 AND (site_url IS NULL OR site_url = '');