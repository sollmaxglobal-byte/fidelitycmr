import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeTxnId } from "@/lib/mm-parse";

type WebhookData = {
  amount?: number | string;
  amount_expected?: number | string;
  currency?: string;
  status?: string;
  payment_method?: string;
  payment_reference?: string;
  reference?: string;
};

function signatureMatches(data: unknown, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(JSON.stringify(data)).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export const Route = createFileRoute("/api/korapay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KORAPAY_SECRET_KEY;
        if (!secret) return new Response("ok", { status: 200 });

        const payload = await request.json().catch(() => null) as { event?: string; data?: WebhookData } | null;
        if (!payload?.data || !signatureMatches(payload.data, request.headers.get("x-korapay-signature"), secret)) {
          return new Response("ok", { status: 200 });
        }

        const event = payload.event ?? "";
        const data = payload.data;
        if (event !== "charge.success" && event !== "charge.failed") {
          return new Response("ok", { status: 200 });
        }
        if (data.payment_method && data.payment_method !== "mobile_money") {
          return new Response("ok", { status: 200 });
        }

        const merchantReference = data.payment_reference ?? data.reference;
        if (!merchantReference) return new Response("ok", { status: 200 });

        const { data: deposit } = await supabaseAdmin
          .from("deposits")
          .select("id,amount,status,reference,ocr_txn_id")
          .eq("reference", merchantReference)
          .maybeSingle();

        if (!deposit) return new Response("ok", { status: 200 });

        if (event === "charge.failed" || String(data.status).toLowerCase() === "failed") {
          await supabaseAdmin
            .from("deposits")
            .update({
              status: "rejected",
              reviewed_at: new Date().toISOString(),
              ocr_txn_id: data.reference ?? deposit.ocr_txn_id,
              auto_note: "Korapay reported a failed mobile-money payment",
            })
            .eq("id", deposit.id)
            .eq("status", "pending");
          return new Response("ok", { status: 200 });
        }

        const gatewayReference = data.reference ?? data.payment_reference;
        const amount = Number(data.amount_expected ?? data.amount);
        if (!gatewayReference || !Number.isFinite(amount) || Math.trunc(amount) !== Math.trunc(Number(deposit.amount))) {
          return new Response("ok", { status: 200 });
        }

        const { res, body } = await fetch(
          `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(gatewayReference)}`,
          { headers: { Authorization: `Bearer ${secret}` } },
        ).then(async (res) => ({ res, body: await res.json().catch(() => null) }));

        const verified = (body as { data?: WebhookData } | null)?.data;
        if (!res.ok || String(verified?.status).toLowerCase() !== "success") {
          return new Response("ok", { status: 200 });
        }

        const verifiedAmount = Number(verified.amount_paid ?? verified.amount ?? verified.amount_expected);
        if (String(verified.currency) !== "XAF" || Math.trunc(verifiedAmount) !== Math.trunc(Number(deposit.amount))) {
          return new Response("ok", { status: 200 });
        }

        const normalized = normalizeTxnId(gatewayReference);
        await supabaseAdmin
          .from("deposits")
          .update({
            ocr_txn_id: gatewayReference,
            ocr_txn_id_norm: normalized,
            ocr_amount: verifiedAmount,
            auto_note: `Korapay verified: ${gatewayReference}`,
          })
          .eq("id", deposit.id)
          .eq("status", "pending");

        const { data: message } = await supabaseAdmin
          .from("mm_messages")
          .insert({
            raw_text: `Korapay charge.success ${gatewayReference} ${verifiedAmount} XAF`,
            sender: "korapay",
            txn_id: gatewayReference,
            txn_id_norm: normalized,
            amount: verifiedAmount,
            received_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (!message) return new Response("ok", { status: 200 });

        await supabaseAdmin.rpc("auto_approve_deposit", {
          _deposit_id: deposit.id,
          _message_id: message.id,
        });

        return new Response("ok", { status: 200 });
      },
    },
  },
});
