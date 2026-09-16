
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS amount_type text NOT NULL DEFAULT 'range' CHECK (amount_type IN ('range','fixed'));
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS fixed_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS sendpulse_embed_html text;
