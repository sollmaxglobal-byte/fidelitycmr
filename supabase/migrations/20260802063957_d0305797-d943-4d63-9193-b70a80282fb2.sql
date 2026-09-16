INSERT INTO public.email_templates (key, name, subject, html_body, enabled)
VALUES (
'withdrawal_approved',
'Withdrawal approved',
'✅ Your withdrawal has been approved — Reference #{{transaction_id}}',
'<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.55">
  <div style="background:#065f46;color:#fff;padding:22px 24px;border-radius:12px 12px 0 0">
    <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.8">{{site_name}}</div>
    <h1 style="margin:6px 0 0;font-size:22px">Withdrawal approved</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px">
    <p>Hello {{name}},</p>
    <p>Good news — your withdrawal request has been reviewed and <strong>approved</strong>. Payment is being sent to the account below and should arrive within 10 minutes.</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#6b7280">Transaction ID</td><td style="padding:8px 0;text-align:right;font-weight:bold">#{{transaction_id}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td style="padding:8px 0;text-align:right;font-weight:bold">{{amount}} XAF</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Method</td><td style="padding:8px 0;text-align:right">{{method}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Account</td><td style="padding:8px 0;text-align:right">{{account}}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0;text-align:right">{{date}}</td></tr>
    </table>
    <p style="text-align:center;margin:26px 0">
      <a href="{{site_url}}/dashboard/wallet" style="background:#065f46;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">View transaction history</a>
    </p>
    <p style="font-size:12px;color:#6b7280">Please keep transaction ID <strong>#{{transaction_id}}</strong> for your records. If you did not request this withdrawal, contact support immediately at {{site_url}}.</p>
  </div>
</div>',
true)
ON CONFLICT (key) DO NOTHING;