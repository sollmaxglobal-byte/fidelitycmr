// Server-only helpers for automatic MTN withdrawal payouts (MacroDroid + USSD).
import { isMtnNumber, localDigits } from "@/lib/mm-network";
import { parseAmount } from "@/lib/mm-parse";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

export type ClaimResult =
  | { claimed: false; reason: string }
  | {
      claimed: true;
      id: string;
      phone: string;
      amount: number;
      account_name: string;
      code: string;
    };

/** Flag pending mobile-money withdrawals going to an MTN number as auto-payable. */
export async function queueEligible(): Promise<number> {
  const db = await admin();
  const { data } = await db
    .from("withdrawals")
    .select("id,account_number,method,status,auto_state")
    .eq("status", "pending")
    .eq("method", "mobile_money")
    .eq("auto_state", "manual")
    .limit(50);

  const ids = ((data ?? []) as Array<{ id: string; account_number: string }>)
    .filter((w) => isMtnNumber(w.account_number))
    .map((w) => w.id);

  if (!ids.length) return 0;
  await db.from("withdrawals").update({ auto_state: "queued" }).in("id", ids);
  return ids.length;
}

/** Claim the next payable withdrawal and return the USSD code to dial. */
export async function claimNext(): Promise<ClaimResult> {
  const db = await admin();
  await queueEligible();
  const { data, error } = await db.rpc("claim_auto_withdrawal");
  if (error) return { claimed: false, reason: error.message };
  return (data ?? { claimed: false, reason: "Nothing to pay" }) as ClaimResult;
}

async function notifyPaid(userId: string, amount: number, id: string) {
  try {
    const { deliver } = await import("@/lib/push.server");
    const db = await admin();
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (subs?.length) {
      await deliver(subs, {
        title: "Withdrawal paid",
        body: `Your withdrawal of ${Math.trunc(amount).toLocaleString("fr-CM")} XAF has been sent to your mobile money account.`,
        url: "/dashboard/wallet",
        tag: `withdrawal-${id}`,
      });
    }
  } catch (err) {
    console.error("[auto-withdraw] push failed", err);
  }

  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) return;
    await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, apikey: key },
      body: JSON.stringify({
        to: `user_id:${userId}`,
        template_key: "withdrawal_paid",
        variables: {
          amount: Math.trunc(amount).toLocaleString("fr-CM"),
          transaction_id: `FID-${id.slice(0, 8).toUpperCase()}`,
          status: "paid",
          date: new Date().toLocaleString(),
        },
      }),
    });
  } catch (err) {
    console.error("[auto-withdraw] email failed", err);
  }
}

/** Finalise a withdrawal that the phone confirmed as sent. */
export async function completeWithdrawal(id: string, ref?: string | null) {
  const db = await admin();
  const { data, error } = await db.rpc("complete_auto_withdrawal", { _id: id, _ref: ref ?? null });
  if (error) return { ok: false, reason: error.message };
  const out = (data ?? {}) as { ok?: boolean; reason?: string; user_id?: string; amount?: number };
  if (out.ok && out.user_id) await notifyPaid(out.user_id, Number(out.amount ?? 0), id);
  return { ok: !!out.ok, reason: out.reason ?? "" };
}

/** Leave a withdrawal pending for manual review. */
export async function failWithdrawal(id: string, note?: string | null) {
  const db = await admin();
  const { error } = await db.rpc("fail_auto_withdrawal", { _id: id, _note: note ?? null });
  return { ok: !error, reason: error?.message ?? "" };
}

const SUCCESS_HINT =
  /(successful|success|effectu[ée]|r[ée]ussi|transferred|transf[ée]r|envoy[ée]|sent to|confirm)/i;
const FAILURE_HINT = /(insufficient|insuffisant|failed|[ée]chou|not enough|cannot|impossible)/i;

/**
 * When MTN confirms an outgoing transfer by SMS, close the matching dispatched
 * withdrawal automatically (amount + destination number must both match).
 */
export async function tryConfirmWithdrawalFromSms(rawText: string): Promise<string | null> {
  const text = (rawText || "").replace(/\s+/g, " ").trim();
  if (!text) return null;

  const db = await admin();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("withdrawals")
    .select("id,amount,account_number,auto_state,status,dispatched_at")
    .eq("status", "pending")
    .eq("auto_state", "dispatched")
    .gte("dispatched_at", since)
    .order("dispatched_at", { ascending: false })
    .limit(20);

  const rows = (data ?? []) as Array<{ id: string; amount: number; account_number: string }>;
  if (!rows.length) return null;

  const digitsInText = text.replace(/[^\d]/g, "");
  const amounts = (text.match(/[\d][\d\s.,]{2,}/g) ?? [])
    .map((a) => parseAmount(a))
    .filter((a): a is number => a !== null);

  for (const w of rows) {
    const phone = localDigits(w.account_number);
    const amount = Math.trunc(Number(w.amount));
    if (!phone || !digitsInText.includes(phone)) continue;
    if (!amounts.includes(amount)) continue;

    if (FAILURE_HINT.test(text)) {
      await failWithdrawal(w.id, "Operator reported a failure — approve manually");
      return w.id;
    }
    if (!SUCCESS_HINT.test(text)) continue;

    const ref = text.match(/\b[A-Z0-9]{8,}\b/)?.[0] ?? null;
    await completeWithdrawal(w.id, ref);
    return w.id;
  }
  return null;
}
