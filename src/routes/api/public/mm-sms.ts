import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z
  .object({
    text: z.string().min(5).max(4000),
    sender: z.string().max(120).optional(),
    secret: z.string().max(200).optional(),
  })
  .or(
    z.object({
      message: z.string().min(5).max(4000),
      from: z.string().max(120).optional(),
      secret: z.string().max(200).optional(),
    }),
  );

export const Route = createFileRoute("/api/public/mm-sms")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { secretMatches, ingestMessage } = await import("@/lib/deposit-verify.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let payload: z.infer<typeof bodySchema>;
        try {
          payload = bodySchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const provided =
          request.headers.get("x-mm-secret")?.trim() ||
          request.headers.get("x-webhook-secret")?.trim() ||
          request.headers
            .get("authorization")
            ?.replace(/^Bearer\s+/i, "")
            .trim() ||
          payload.secret?.trim() ||
          null;
        const text = "text" in payload ? payload.text : payload.message;
        const sender = "sender" in payload ? payload.sender : payload.from;

        const { data: settings } = await supabaseAdmin
          .from("app_settings")
          .select("mm_webhook_secret")
          .eq("id", 1)
          .maybeSingle();
        const expected =
          settings?.mm_webhook_secret ?? process.env["MM_SMS_WEBHOOK_SECRET"] ?? null;

        if (!expected || !secretMatches(provided || payload.secret || null, expected)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const result = await ingestMessage(text, sender ?? "sms-forwarder");
          // An outgoing MTN transfer confirmation closes the matching auto withdrawal.
          let withdrawalId: string | null = null;
          try {
            const { tryConfirmWithdrawalFromSms } = await import("@/lib/withdraw-auto.server");
            withdrawalId = await tryConfirmWithdrawalFromSms(text);
          } catch (err) {
            console.error("[mm-sms] withdrawal match failed", err);
          }
          return Response.json({ ...result, withdrawal_id: withdrawalId });
        } catch (err) {
          console.error("[mm-sms] ingest failed", err);
          return new Response(JSON.stringify({ error: "Could not process message" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
