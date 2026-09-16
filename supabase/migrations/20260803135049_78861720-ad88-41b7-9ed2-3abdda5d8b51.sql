create or replace function public.referrer_name(_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.full_name from public.profiles p
  where p.referral_code is not null
    and lower(p.referral_code) = lower(trim(_code))
  limit 1
$$;

grant execute on function public.referrer_name(text) to anon, authenticated;

update public.email_templates
set subject = '💸 Withdrawal paid — {{amount}} XAF sent (Ref #{{transaction_id}})',
    html_body = '<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9ef">
    <div style="background:#0b2540;padding:20px 24px;color:#ffffff">
      <div style="font-size:20px;font-weight:bold">{{site_name}}</div>
      <div style="font-size:13px;opacity:.8">Payout confirmation</div>
    </div>
    <div style="padding:24px;color:#1c2733;font-size:15px;line-height:1.6">
      <p>Hello {{name}},</p>
      <p>Your withdrawal of <strong>{{amount}} XAF</strong> has been <strong>paid</strong> and sent to the payout account you provided. Depending on your provider, funds usually arrive within a few minutes.</p>

      <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#6b7280">Transaction reference</td><td style="padding:8px 0;text-align:right"><strong>#{{transaction_id}}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Amount paid</td><td style="padding:8px 0;text-align:right"><strong>{{amount}} XAF</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Status</td><td style="padding:8px 0;text-align:right"><strong>PAID</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0;text-align:right">{{date}}</td></tr>
      </table>

      <div style="background:#f0f7f3;border:1px solid #cfe6da;border-radius:10px;padding:16px;margin:18px 0">
        <div style="font-weight:bold;color:#0b2540;margin-bottom:8px">Payout account details</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280">Payout method</td><td style="padding:6px 0;text-align:right"><strong>{{method}}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Account name</td><td style="padding:6px 0;text-align:right"><strong>{{account_name}}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Account / number</td><td style="padding:6px 0;text-align:right"><strong>{{account_number}}</strong></td></tr>
        </table>
      </div>

      <p>If you do not see the funds after 30 minutes, reply to this email or contact support with reference <strong>#{{transaction_id}}</strong>.</p>
      <p style="margin:24px 0">
        <a href="{{site_url}}/dashboard/wallet" style="background:#0b2540;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block">View my wallet</a>
      </p>
      <p style="color:#6b7280;font-size:13px">Never share your password or one-time codes. {{site_name}} staff will never ask for them.</p>
    </div>
    <div style="background:#f4f6f8;padding:16px 24px;color:#6b7280;font-size:12px">
      {{site_name}} · Douala, Cameroon<br/>Investments carry risk. Only invest what you can afford to lose.
    </div>
  </div>
</div>'
where key = 'withdrawal_paid';