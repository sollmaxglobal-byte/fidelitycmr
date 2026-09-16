import { createFileRoute } from "@tanstack/react-router";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return `${String(dt.getUTCDate()).padStart(2, "0")} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
function ref(id: string) {
  return id.replace(/-/g, "").slice(0, 12).toUpperCase();
}
function amount(n: number) {
  return String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

async function processQueue() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const supabaseUrl = process.env["SUPABASE_URL"]!;
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const anonKey = process.env["SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !serviceKey || !anonKey) throw new Error("Email processor is not configured");

  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("site_name,site_url")
    .eq("id", 1)
    .maybeSingle();
  const siteUrl = settings?.site_url || "https://fidelity-invest.lovable.app";

  const { data: due } = await supabaseAdmin
    .from("receipt_email_queue")
    .select("*")
    .is("sent_at", null)
    .lt("attempts", 5)
    .lte("send_after", new Date().toISOString())
    .order("send_after", { ascending: true })
    .limit(25);

  let sent = 0;
  for (const job of due ?? []) {
    try {
      const isDeposit = job.kind === "deposit";
      const table = isDeposit ? "deposits" : "withdrawals";
      const { data: row } = await supabaseAdmin
        .from(table)
        .select("*")
        .eq("id", job.ref_id)
        .maybeSingle();
      if (!row) throw new Error("transaction not found");

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name,preferred_language")
        .eq("id", job.user_id)
        .maybeSingle();

      let method = "—";
      if (isDeposit && (row as { payment_method_id?: string }).payment_method_id) {
        const { data: m } = await supabaseAdmin
          .from("payment_methods")
          .select("label")
          .eq("id", (row as { payment_method_id: string }).payment_method_id)
          .maybeSingle();
        method = m?.label ?? "—";
      } else if (!isDeposit) {
        method = String((row as { method?: string }).method ?? "—");
      }

      const status = String(job.final_status);
      const ok = status === "approved" || status === "paid" || status === "completed";
      const statusLabel = ok ? "Successful" : status === "rejected" ? "Rejected" : "Pending";
      const statusColor = ok ? "#1f9d6b" : status === "rejected" ? "#c0392b" : "#c98a00";
      const statusMessage = ok
        ? isDeposit
          ? "Your funds have been credited to your account balance."
          : "Your payout has been processed to the account below."
        : "This transaction was declined. Contact support if you need assistance.";

      const variables: Record<string, string> = {
        name: profile?.full_name || "Investor",
        transaction_id: ref(job.ref_id),
        amount: amount(Number((row as { amount: number }).amount)),
        status_label: statusLabel,
        status_color: statusColor,
        status_message: statusMessage,
        method,
        payer_phone: String((row as { payer_phone?: string }).payer_phone ?? "—"),
        account_name: String((row as { account_name?: string }).account_name ?? "—"),
        account_number: String((row as { account_number?: string }).account_number ?? "—"),
        created_at: fmtDate((row as { created_at: string }).created_at),
        reviewed_at: fmtDate((row as { reviewed_at?: string }).reviewed_at),
        receipt_url: `${siteUrl}/dashboard/receipt/${job.kind}/${job.ref_id}`,
      };

      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "x-internal-secret": serviceKey,
        },
        body: JSON.stringify({
          to: `user_id:${job.user_id}`,
          template_key: isDeposit ? "deposit_receipt" : "withdrawal_receipt",
          variables,
          lang: profile?.preferred_language === "fr" ? "fr" : "en",
        }),
      });
      if (!res.ok) throw new Error(`send-email ${res.status}: ${await res.text()}`);

      await supabaseAdmin
        .from("receipt_email_queue")
        .update({ sent_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq("id", job.id);
      sent++;
    } catch (e) {
      await supabaseAdmin
        .from("receipt_email_queue")
        .update({
          attempts: job.attempts + 1,
          last_error: String((e as Error)?.message ?? e),
          send_after: new Date(Date.now() + Math.min(15, 2 ** job.attempts) * 60_000).toISOString(),
        })
        .eq("id", job.id);
    }
  }
  return sent;
}

function isAuthorized(request: Request) {
  const expected = process.env["SUPABASE_ANON_KEY"];
  return !!expected && request.headers.get("apikey") === expected;
}

export const Route = createFileRoute("/api/public/process-receipt-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request))
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        const sent = await processQueue();
        return new Response(JSON.stringify({ ok: true, sent }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async ({ request }) => {
        if (!isAuthorized(request))
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        const sent = await processQueue();
        return new Response(JSON.stringify({ ok: true, sent }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
