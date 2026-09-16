// Server-only helpers for automatic deposit verification.
import { normalizeTxnId, parseAmount, parseMmMessage } from "@/lib/mm-parse";

const AI_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export type OcrResult = {
  transaction_id: string | null;
  amount: number | null;
  currency: string | null;
  receiver: string | null;
  payer_number: string | null;
  datetime: string | null;
};

async function aiFetch(body: unknown, attempt = 0): Promise<Response> {
  const key = process.env["AI_GATEWAY_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    const retryAfter = Number(res.headers.get("retry-after")) || 2 ** attempt;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return aiFetch(body, attempt + 1);
  }
  return res;
}

/** Extract a transaction reference and amount from a forwarded mobile-money SMS. */
async function readSms(rawText: string): Promise<{ transaction_id: string | null; amount: number | null }> {
  const res = await aiFetch({
    model: MODEL,
    temperature: 0,
    max_tokens: 160,
    messages: [
      { role: "system", content: "Extract payment data from Cameroon mobile-money SMS. Return JSON only with keys transaction_id and amount. Use the operator transaction/reference ID, never a platform ID. Amount must be a plain number." },
      { role: "user", content: rawText.slice(0, 4000) },
    ],
  });
  if (!res.ok) throw new Error(`AI SMS extraction failed (${res.status})`);
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const match = (body.choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI SMS extraction returned no JSON");
  const parsed = JSON.parse(match[0]) as { transaction_id?: unknown; amount?: unknown };
  return { transaction_id: typeof parsed.transaction_id === "string" ? parsed.transaction_id : null, amount: parseAmount(typeof parsed.amount === "number" || typeof parsed.amount === "string" ? parsed.amount : null) };
}

/** Read a payment screenshot and extract the transaction details. */
export async function readProof(imageUrl: string): Promise<OcrResult> {
  const res = await aiFetch({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You read mobile money payment receipts/screenshots (MTN Mobile Money, Orange Money, bank apps) from Cameroon. " +
          "Reply with STRICT JSON only, no markdown, using this shape: " +
          '{"transaction_id":string|null,"amount":number|null,"currency":string|null,"receiver":string|null,"payer_number":string|null,"datetime":string|null}. ' +
          "amount must be a plain number without separators. transaction_id is the operator reference / transaction ID exactly as printed. Use null when unreadable.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the payment details from this receipt." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 402 || res.status === 403) {
      throw new Error(
        "Automatic reading is paused (AI credits unavailable) — approve this deposit manually.",
      );
    }
    if (res.status === 429)
      throw new Error("Automatic reading is busy — try Re-check in a moment.");
    throw new Error(`AI read failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned an unreadable result");
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  return {
    transaction_id: (parsed["transaction_id"] as string | null) ?? null,
    amount: parseAmount(parsed["amount"] as string | number | null),
    currency: (parsed["currency"] as string | null) ?? null,
    receiver: (parsed["receiver"] as string | null) ?? null,
    payer_number: (parsed["payer_number"] as string | null) ?? null,
    datetime: (parsed["datetime"] as string | null) ?? null,
  };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function setNote(depositId: string, note: string) {
  const db = await admin();
  await db.from("deposits").update({ auto_note: note }).eq("id", depositId);
}

async function notifyApproved(userId: string, amount: number, depositId: string) {
  try {
    const { deliver } = await import("@/lib/push.server");
    const db = await admin();
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (subs?.length) {
      await deliver(subs, {
        title: "Deposit successful",
        body: `Your deposit of ${Math.trunc(amount).toLocaleString("fr-CM")} XAF has been approved and added to your balance.`,
        url: "/dashboard/wallet",
        tag: `deposit-${depositId}`,
      });
    }
  } catch (err) {
    console.error("[auto-deposit] push failed", err);
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
        template_key: "deposit_approved",
        variables: {
          amount: Math.trunc(amount).toLocaleString("fr-CM"),
          transaction_id: `FID-${depositId.slice(0, 8).toUpperCase()}`,
          date: new Date().toLocaleString(),
        },
      }),
    });
  } catch (err) {
    console.error("[auto-deposit] email failed", err);
  }
}

/**
 * Try to auto-approve a pending deposit: its screenshot transaction ID must match a
 * received operator message, and both amounts must equal the submitted amount.
 */
export async function tryMatchDeposit(
  depositId: string,
): Promise<{ approved: boolean; reason: string }> {
  const db = await admin();
  const { data: deposit } = await db
    .from("deposits")
    .select("id,user_id,amount,status,ocr_txn_id_norm,ocr_amount")
    .eq("id", depositId)
    .maybeSingle();

  if (!deposit) return { approved: false, reason: "Deposit not found" };
  if (deposit.status !== "pending") return { approved: false, reason: "Deposit already reviewed" };
  if (!deposit.ocr_txn_id_norm) {
    const reason = "No transaction ID could be read from the screenshot";
    await setNote(depositId, reason);
    return { approved: false, reason };
  }
  if (
    deposit.ocr_amount === null ||
    Math.trunc(Number(deposit.ocr_amount)) !== Math.trunc(Number(deposit.amount))
  ) {
    const reason = `Screenshot amount (${deposit.ocr_amount ?? "unreadable"}) does not match submitted amount (${deposit.amount})`;
    await setNote(depositId, reason);
    return { approved: false, reason };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: message } = await db
    .from("mm_messages")
    .select("id,amount,txn_id,received_at,matched_deposit_id")
    .eq("txn_id_norm", deposit.ocr_txn_id_norm)
    .gte("received_at", since)
    .is("matched_deposit_id", null)
    .order("received_at", { ascending: false })
    .maybeSingle();

  if (!message) {
    const reason = "Waiting for the operator confirmation message";
    await setNote(depositId, reason);
    return { approved: false, reason };
  }
  if (
    message.amount === null ||
    Math.trunc(Number(message.amount)) !== Math.trunc(Number(deposit.amount))
  ) {
    const reason = `Amount mismatch: received ${message.amount ?? "?"} vs submitted ${deposit.amount}`;
    await setNote(depositId, reason);
    return { approved: false, reason };
  }

  const { data: result, error } = await db.rpc("auto_approve_deposit", {
    _deposit_id: deposit.id,
    _message_id: message.id,
  });
  if (error) {
    await setNote(depositId, `Auto-approval error: ${error.message}`);
    return { approved: false, reason: error.message };
  }
  const outcome = (result ?? {}) as { approved?: boolean; reason?: string };
  if (outcome.approved) {
    await notifyApproved(deposit.user_id, Number(deposit.amount), deposit.id);
    return { approved: true, reason: "Approved" };
  }
  await setNote(depositId, outcome.reason ?? "Not approved");
  return { approved: false, reason: outcome.reason ?? "Not approved" };
}

/** Read a deposit's proof screenshot, store what was read, then attempt a match. */
export async function verifyDeposit(depositId: string, userId?: string) {
  const db = await admin();
  const { data: deposit } = await db
    .from("deposits")
    .select("id,user_id,amount,status,proof_url,ocr_txn_id_norm")
    .eq("id", depositId)
    .maybeSingle();
  if (!deposit) throw new Error("Deposit not found");
  if (userId && deposit.user_id !== userId) throw new Error("Forbidden");
  if (deposit.status !== "pending") return { approved: false, reason: "Deposit already reviewed" };

  if (!deposit.ocr_txn_id_norm) {
    if (!deposit.proof_url) return { approved: false, reason: "No payment proof uploaded" };
    const { data: signed } = await db.storage
      .from("payment-proofs")
      .createSignedUrl(deposit.proof_url, 600);
    if (!signed?.signedUrl) return { approved: false, reason: "Could not open the payment proof" };

    try {
      const ocr = await readProof(signed.signedUrl);
      await db
        .from("deposits")
        .update({
          ocr_txn_id: ocr.transaction_id,
          ocr_txn_id_norm: normalizeTxnId(ocr.transaction_id),
          ocr_amount: ocr.amount,
          ocr_payer: ocr.payer_number,
          ocr_raw: JSON.parse(JSON.stringify(ocr)),
        })
        .eq("id", deposit.id);
    } catch (err) {
      const reason = `Screenshot could not be read: ${(err as Error).message}`;
      await setNote(deposit.id, reason);
      return { approved: false, reason };
    }
  }

  return tryMatchDeposit(deposit.id);
}

/** Store an incoming operator message and try to clear a matching pending deposit. */
export async function ingestMessage(rawText: string, sender?: string | null) {
  const db = await admin();
  const parsed = parseMmMessage(rawText);
  let aiParsed: { transaction_id: string | null; amount: number | null } | null = null;
  try {
    aiParsed = await readSms(rawText);
  } catch (error) {
    console.warn("[auto-deposit] AI SMS extraction unavailable; using deterministic parser", error);
  }
  const extractedTxnId = aiParsed?.transaction_id ?? parsed.txnId;
  const extractedAmount = aiParsed?.amount ?? parsed.amount;
  const txnIdNorm = normalizeTxnId(extractedTxnId);

  let messageId: string | null = null;
  const { data: inserted, error } = await db
    .from("mm_messages")
    .insert({
      raw_text: rawText.slice(0, 4000),
      received_at: new Date().toISOString(),
      sender: sender ?? null,
      txn_id: extractedTxnId,
      txn_id_norm: txnIdNorm,
      amount: extractedAmount,
      payer_number: parsed.payerNumber,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (!txnIdNorm) throw new Error(error.message);
    const { data: existing } = await db
      .from("mm_messages")
      .select("id")
      .eq("txn_id_norm", txnIdNorm)
      .maybeSingle();
    if (!existing) throw new Error(error.message);
    messageId = existing.id;
  } else {
    messageId = inserted?.id ?? null;
  }

  if (!txnIdNorm) {
    return {
      stored: true,
      messageId,
      matched: false,
      reason: "No transaction ID found in the message",
    };
  }

  const { data: deposit } = await db
    .from("deposits")
    .select("id")
    .eq("status", "pending")
    .eq("ocr_txn_id_norm", txnIdNorm)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!deposit)
    return {
      stored: true,
      messageId,
      matched: false,
      reason: "No pending deposit with this transaction ID",
    };

  const outcome = await tryMatchDeposit(deposit.id);
  return {
    stored: true,
    messageId,
    matched: outcome.approved,
    reason: outcome.reason,
    depositId: deposit.id,
  };
}

/** Timing-safe-ish comparison of the forwarder secret. */
export function secretMatches(provided: string | null, expected: string | null | undefined) {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i += 1)
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
