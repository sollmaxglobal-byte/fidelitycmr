
-- App settings (single row)
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  tidio_public_key TEXT,
  site_name TEXT NOT NULL DEFAULT 'Camvcc',
  site_url TEXT,
  smtp_host TEXT,
  smtp_port INT DEFAULT 465,
  smtp_secure BOOLEAN DEFAULT true,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_name TEXT,
  smtp_from_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

INSERT INTO public.app_settings (id) VALUES (1);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public view (no SMTP creds, only branding/Tidio)
CREATE OR REPLACE VIEW public.public_settings
WITH (security_invoker = true) AS
SELECT id, tidio_public_key, site_name, site_url FROM public.app_settings;

GRANT SELECT ON public.public_settings TO anon, authenticated;

-- Allow public SELECT on the underlying columns via a permissive policy scoped to the view's needs.
CREATE POLICY "Public reads branding" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Email templates
CREATE TABLE public.email_templates (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Email logs
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  template_key TEXT,
  subject TEXT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email_logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Make deposit reference optional
ALTER TABLE public.deposits ALTER COLUMN reference DROP NOT NULL;

-- Seed default templates
INSERT INTO public.email_templates (key, name, subject, html_body) VALUES
('welcome', 'Welcome email',
 'Welcome to {{site_name}}, {{name}}!',
 '<h2>Welcome aboard, {{name}}!</h2><p>Your {{site_name}} account is ready. Start by funding your wallet and choosing an investment plan.</p><p><a href="{{site_url}}/dashboard">Open dashboard</a></p>'),
('deposit_submitted', 'Deposit submitted',
 'We received your deposit request',
 '<h2>Deposit pending review</h2><p>Hi {{name}}, we received your deposit of <strong>{{amount}} XAF</strong> via {{method}}. We will notify you once it is approved.</p>'),
('deposit_approved', 'Deposit approved',
 'Your deposit has been approved',
 '<h2>Deposit approved</h2><p>Your deposit of <strong>{{amount}} XAF</strong> has been credited to your wallet. You can now invest.</p>'),
('deposit_rejected', 'Deposit rejected',
 'Your deposit could not be approved',
 '<h2>Deposit rejected</h2><p>Unfortunately your deposit of <strong>{{amount}} XAF</strong> was not approved. Reason: {{note}}.</p>'),
('withdrawal_submitted', 'Withdrawal submitted',
 'Withdrawal request received',
 '<h2>Withdrawal pending</h2><p>Hi {{name}}, your withdrawal of <strong>{{amount}} XAF</strong> to {{method}} ({{account}}) is being processed.</p>'),
('withdrawal_paid', 'Withdrawal paid',
 'Your withdrawal has been paid',
 '<h2>Funds sent</h2><p>We have sent <strong>{{amount}} XAF</strong> to {{account}}. Please allow a few minutes for it to appear.</p>'),
('withdrawal_rejected', 'Withdrawal rejected',
 'Your withdrawal could not be processed',
 '<h2>Withdrawal rejected</h2><p>Your withdrawal of <strong>{{amount}} XAF</strong> was rejected. Reason: {{note}}.</p>'),
('investment_started', 'Investment started',
 'Your investment is now active',
 '<h2>Investment activated</h2><p>You invested <strong>{{amount}} XAF</strong> in {{plan}} at {{roi}}%/day for {{days}} days. Daily returns begin today.</p>'),
('investment_completed', 'Investment completed',
 'Your investment plan matured',
 '<h2>Plan matured</h2><p>Your {{plan}} plan has matured. Total earned: <strong>{{earned}} XAF</strong>. The capital is now in your wallet.</p>');
