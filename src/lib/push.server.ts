// Server-only push delivery helpers. Never imported by client code directly.
export type PushRow = { id: string; endpoint: string; p256dh: string; auth: string };
export type PushMessage = { title: string; body: string; url?: string; tag?: string };

export async function deliver(rows: PushRow[], message: PushMessage) {
  const { buildPushPayload } = await import("@block65/webcrypto-web-push");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const vapid = {
    subject: process.env["VAPID_SUBJECT"] ?? "mailto:support@fidelity.app",
    publicKey: process.env["VAPID_PUBLIC_KEY"],
    privateKey: process.env["VAPID_PRIVATE_KEY"],
  };
  if (!vapid.publicKey || !vapid.privateKey) throw new Error("Push keys are not configured");

  let sent = 0;
  const stale: string[] = [];
  const failures: Array<{ endpoint: string; status: number; response: string }> = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        const init = await buildPushPayload(
          { data: message, options: { ttl: 3600, urgency: "high" } },
          {
            endpoint: row.endpoint,
            expirationTime: null,
            keys: { auth: row.auth, p256dh: row.p256dh },
          },
          vapid as { subject: string; publicKey: string; privateKey: string },
        );
        const res = await fetch(row.endpoint, init as RequestInit);
        if (res.ok || res.status === 201) sent += 1;
        else {
          const response = (await res.text()).slice(0, 300);
          failures.push({ endpoint: row.endpoint.slice(0, 80), status: res.status, response });
          if ([400, 401, 403, 404, 410].includes(res.status)) stale.push(row.endpoint);
        }
      } catch (err) {
        console.error("[push] delivery failed", err);
      }
    }),
  );

  if (stale.length) await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", stale);
  if (failures.length) console.error("[push] rejected subscriptions", failures);
  return sent;
}

export async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}
