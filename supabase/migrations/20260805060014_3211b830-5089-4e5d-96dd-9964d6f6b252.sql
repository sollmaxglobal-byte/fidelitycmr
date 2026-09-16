ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS subject_fr text;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS html_body_fr text;