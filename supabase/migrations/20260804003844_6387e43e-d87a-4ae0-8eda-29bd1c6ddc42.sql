
CREATE TABLE IF NOT EXISTS public.receipt_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('deposit','withdrawal')),
  ref_id UUID NOT NULL,
  final_status TEXT NOT NULL,
  send_after TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 minutes',
  sent_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, ref_id, final_status)
);

GRANT ALL ON public.receipt_email_queue TO service_role;
ALTER TABLE public.receipt_email_queue ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.queue_receipt_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k TEXT := TG_ARGV[0];
BEGIN
  IF NEW.status::text IS DISTINCT FROM OLD.status::text
     AND NEW.status::text IN ('approved','rejected','paid','completed') THEN
    INSERT INTO public.receipt_email_queue (user_id, kind, ref_id, final_status)
    VALUES (NEW.user_id, k, NEW.id, NEW.status::text)
    ON CONFLICT (kind, ref_id, final_status) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_receipt_email ON public.deposits;
CREATE TRIGGER trg_deposit_receipt_email
AFTER UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.queue_receipt_email('deposit');

DROP TRIGGER IF EXISTS trg_withdrawal_receipt_email ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_receipt_email
AFTER UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.queue_receipt_email('withdrawal');

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ BEGIN
  PERFORM cron.unschedule('process-receipt-emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'process-receipt-emails',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://fidelity-invest.lovable.app/api/public/process-receipt-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);

INSERT INTO public.email_templates (key, name, subject, html_body, enabled) VALUES
('deposit_receipt', 'Deposit receipt', 'Your Fidelity deposit receipt — #{{transaction_id}}',
'<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;padding:24px"><div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8ee"><div style="background:#0b3d2e;color:#ffffff;padding:20px 24px"><div style="font-size:20px;font-weight:bold;letter-spacing:.5px">FIDELITY</div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85">Official transaction receipt</div></div><div style="padding:18px 24px;background:{{status_color}};color:#ffffff"><div style="font-size:18px;font-weight:bold;text-transform:uppercase">Deposit {{status_label}}</div><div style="font-size:13px;opacity:.95">{{status_message}}</div></div><div style="padding:24px"><p style="font-size:14px;color:#333">Dear {{name}},</p><p style="font-size:14px;color:#333;line-height:1.6">Please find below the official receipt for your deposit request on {{site_name}}. Keep the transaction ID for any support enquiry.</p><div style="text-align:center;margin:22px 0"><div style="font-size:11px;letter-spacing:2px;color:#8a95a1;text-transform:uppercase">Amount</div><div style="font-size:30px;font-weight:bold;color:#0b3d2e">{{amount}} XAF</div></div><table style="width:100%;border-collapse:collapse;font-size:13px;color:#333"><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Transaction ID</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right;font-weight:bold">#{{transaction_id}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Type</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">Deposit (Credit)</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Status</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right;font-weight:bold">{{status_label}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Payment method</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{method}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Payer phone</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{payer_phone}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Date submitted</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{created_at}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Date processed</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{reviewed_at}}</td></tr><tr><td style="padding:9px 0;color:#8a95a1">Account holder</td><td style="padding:9px 0;text-align:right">{{name}}</td></tr></table><div style="margin:22px 0;text-align:center"><a href="{{receipt_url}}" style="background:#0b3d2e;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block">View &amp; download receipt</a></div><div style="margin-top:26px;text-align:center"><div style="display:inline-block;border:3px solid #1f9d6b;color:#1f9d6b;border-radius:50%;padding:16px 14px;transform:rotate(-8deg);font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Fidelity<br/>Verified<br/>#{{transaction_id}}</div></div><p style="margin-top:24px;font-size:11px;color:#8a95a1;line-height:1.6">This receipt is computer generated and constitutes an official record of the transaction listed above. If you did not authorise this transaction, contact support immediately at {{site_url}}.</p></div><div style="background:#f7f9fb;padding:14px 24px;font-size:11px;color:#8a95a1;text-align:center">&copy; {{site_name}} — All rights reserved.</div></div></div>',
 true),
('withdrawal_receipt', 'Withdrawal receipt', 'Your Fidelity withdrawal receipt — #{{transaction_id}}',
'<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;padding:24px"><div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8ee"><div style="background:#0b3d2e;color:#ffffff;padding:20px 24px"><div style="font-size:20px;font-weight:bold;letter-spacing:.5px">FIDELITY</div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85">Official transaction receipt</div></div><div style="padding:18px 24px;background:{{status_color}};color:#ffffff"><div style="font-size:18px;font-weight:bold;text-transform:uppercase">Withdrawal {{status_label}}</div><div style="font-size:13px;opacity:.95">{{status_message}}</div></div><div style="padding:24px"><p style="font-size:14px;color:#333">Dear {{name}},</p><p style="font-size:14px;color:#333;line-height:1.6">Please find below the official receipt for your withdrawal request on {{site_name}}. Keep the transaction ID for any support enquiry.</p><div style="text-align:center;margin:22px 0"><div style="font-size:11px;letter-spacing:2px;color:#8a95a1;text-transform:uppercase">Amount</div><div style="font-size:30px;font-weight:bold;color:#0b3d2e">{{amount}} XAF</div></div><table style="width:100%;border-collapse:collapse;font-size:13px;color:#333"><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Transaction ID</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right;font-weight:bold">#{{transaction_id}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Type</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">Withdrawal (Debit)</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Status</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right;font-weight:bold">{{status_label}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Payout method</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{method}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Account name</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{account_name}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Account number</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{account_number}}</td></tr><tr><td style="padding:9px 0;border-bottom:1px solid #eef1f4;color:#8a95a1">Date requested</td><td style="padding:9px 0;border-bottom:1px solid #eef1f4;text-align:right">{{created_at}}</td></tr><tr><td style="padding:9px 0;color:#8a95a1">Date processed</td><td style="padding:9px 0;text-align:right">{{reviewed_at}}</td></tr></table><div style="margin:22px 0;text-align:center"><a href="{{receipt_url}}" style="background:#0b3d2e;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block">View &amp; download receipt</a></div><div style="margin-top:26px;text-align:center"><div style="display:inline-block;border:3px solid #1f9d6b;color:#1f9d6b;border-radius:50%;padding:16px 14px;transform:rotate(-8deg);font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Fidelity<br/>Verified<br/>#{{transaction_id}}</div></div><p style="margin-top:24px;font-size:11px;color:#8a95a1;line-height:1.6">This receipt is computer generated and constitutes an official record of the transaction listed above. If you did not authorise this transaction, contact support immediately at {{site_url}}.</p></div><div style="background:#f7f9fb;padding:14px 24px;font-size:11px;color:#8a95a1;text-align:center">&copy; {{site_name}} — All rights reserved.</div></div></div>',
 true)
ON CONFLICT (key) DO UPDATE SET subject = EXCLUDED.subject, html_body = EXCLUDED.html_body, name = EXCLUDED.name;

UPDATE public.app_settings SET site_name = 'Fidelity', site_url = 'https://fidelity-invest.lovable.app' WHERE id = 1;
