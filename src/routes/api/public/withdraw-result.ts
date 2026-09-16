import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["success", "sent", "paid", "failed", "error"]),
  ref: z.string().max(80).optional().nullable(),
  note: z.string().max(400).optional().nullable(),
  secret: z.string().max(200).optional(),
});

export const Route = createFileRoute("/api/public/withdraw-result")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { secretMatches } = await import("@/lib/deposit-verify.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { completeWithdrawal, failWithdrawal } = await import("@/lib/withdraw-auto.server");

        let payload: z.infer<typeof bodySchema>;
        try {
          payload = bodySchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const authorization = request.headers.get("authorization");
        const provided =
          request.headers.get("x-mm-secret")?.trim() ||
          (authorization ? authorization.replace(/^Bearer\s+/i, "").trim() : "") ||
          payload.secret?.trim() ||
          null;

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
          const ok = ["success", "sent", "paid"].includes(payload.status);
          const result = ok
            ? await completeWithdrawal(payload.id, payload.ref ?? null)
            : await failWithdrawal(payload.id, payload.note ?? "Phone reported a failure");
          return Response.json(result);
        } catch (err) {
          console.error("[withdraw-result] failed", err);
          return new Response(JSON.stringify({ error: "Could not record the result" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
