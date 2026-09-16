import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SubInput = { endpoint: string; p256dh: string; auth: string; userAgent?: string };

export const getPushPublicKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    if (!publicKey) throw new Error("Push notifications are not configured");
    return { publicKey };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: SubInput) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { endpoint: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const sendPushBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { title: string; body: string; url?: string }) => data)
  .handler(async ({ data, context }) => {
    const { deliver, assertAdmin } = await import("@/lib/push.server");
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth");
    const sent = await deliver(rows ?? [], {
      title: data.title,
      body: data.body,
      url: data.url || "/dashboard",
      tag: `broadcast-${Date.now()}`,
    });
    await supabaseAdmin.from("push_broadcasts").insert({
      title: data.title,
      body: data.body,
      url: data.url ?? null,
      created_by: context.userId,
      sent_count: sent,
    });
    return { sent, devices: (rows ?? []).length };
  });

export const sendPushToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: { userId: string; title: string; body: string; url?: string; tag?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { deliver, assertAdmin } = await import("@/lib/push.server");
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", data.userId);
    const sent = await deliver(rows ?? [], {
      title: data.title,
      body: data.body,
      url: data.url || "/dashboard/wallet",
      tag: data.tag || `tx-${Date.now()}`,
    });
    return { sent };
  });
