import { createFileRoute } from "@tanstack/react-router";

/**
 * MacroDroid polls this endpoint. It returns the next MTN withdrawal to pay,
 * with the ready-to-dial USSD code, or {"claimed":false} when there is nothing.
 */
async function handle(request: Request) {
  const { secretMatches } = await import("@/lib/deposit-verify.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { claimNext } = await import("@/lib/withdraw-auto.server");

  let bodySecret: string | null = null;
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { secret?: string };
      bodySecret = typeof body?.secret === "string" ? body.secret : null;
    } catch {
      bodySecret = null;
    }
  }
  const authorization = request.headers.get("authorization");
  const provided =
    request.headers.get("x-mm-secret")?.trim() ||
    (authorization ? authorization.replace(/^Bearer\s+/i, "").trim() : "") ||
    bodySecret?.trim() ||
    null;

  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("mm_webhook_secret")
    .eq("id", 1)
    .maybeSingle();
  const expected = settings?.mm_webhook_secret ?? process.env["MM_SMS_WEBHOOK_SECRET"] ?? null;

  if (!expected || !secretMatches(provided, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const result = await claimNext();
    return Response.json(result);
  } catch (err) {
    console.error("[withdraw-queue] failed", err);
    return new Response(JSON.stringify({ error: "Could not read the queue" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/withdraw-queue")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
