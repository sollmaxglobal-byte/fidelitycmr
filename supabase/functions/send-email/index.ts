import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import nodemailer from "npm:nodemailer@6.9.14";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function render(tpl: string, vars: Record<string, unknown>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  // Trusted internal caller (server-side queue processor) presents the service key.
  const internalSecret = req.headers.get("x-internal-secret") ?? "";
  const isInternal = !!serviceKey && internalSecret === serviceKey;

  // Require an authenticated caller. Only admins are permitted to trigger
  // arbitrary email sends (prevents open-relay abuse of SMTP credentials).
  let isAdmin = isInternal;
  let userData: { user: { id: string; email?: string | null } | null } | null = null;
  if (!isInternal) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7).trim();
    const { data: ud, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !ud?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    userData = ud;
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", ud.user.id)
      .eq("role", "admin")
      .maybeSingle();
    isAdmin = !!roleRow;
  }

  try {
    const body = await req.json();
    let { to } = body ?? {};
    const { template_key, variables = {}, subject: customSubject, html: customHtml } = body ?? {};

    // Non-admin users may only trigger their own self-notification templates.
    const SELF_TEMPLATES = [
      "welcome",
      "deposit_submitted",
      "withdrawal_submitted",
      "investment_started",
      "password_reset",
    ];
    if (!isAdmin) {
      const selfEmail = (userData.user.email ?? "").toLowerCase();
      const selfOk =
        typeof to === "string" &&
        (to.toLowerCase() === selfEmail || to === `user_id:${userData.user.id}`);
      if (customHtml || !template_key || !SELF_TEMPLATES.includes(template_key) || !selfOk) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }
    if (!to || (!template_key && !customHtml)) {
      return new Response(JSON.stringify({ error: "to and template_key (or html) required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Resolve "user_id:<uuid>" recipients to the user's email
    let recipientUserId: string | null = null;
    if (
      userData?.user?.id &&
      typeof to === "string" &&
      to.toLowerCase() === (userData.user.email ?? "").toLowerCase()
    ) {
      recipientUserId = userData.user.id;
    }
    if (typeof to === "string" && to.startsWith("user_id:")) {
      const uid = to.slice(8).trim();
      recipientUserId = uid;

      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        if (data?.user?.email) to = data.user.email;
        else
          return new Response(JSON.stringify({ error: "User email not found" }), {
            status: 404,
            headers: { ...cors, "Content-Type": "application/json" },
          });
      } catch (_e) {
        return new Response(JSON.stringify({ error: "User lookup failed" }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const { data: settings } = await admin
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_password) {
      return new Response(
        JSON.stringify({
          error: "SMTP not configured. Open Admin → Settings to add SMTP credentials.",
        }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    let subject = customSubject as string | undefined;
    let html = customHtml as string | undefined;

    // Resolve the recipient's preferred language (profile setting wins, then body.lang)
    let lang = (body?.lang === "fr" ? "fr" : body?.lang === "en" ? "en" : null) as
      "en" | "fr" | null;
    if (recipientUserId) {
      const { data: prof } = await admin
        .from("profiles")
        .select("preferred_language")
        .eq("id", recipientUserId)
        .maybeSingle();
      if (prof?.preferred_language === "fr" || prof?.preferred_language === "en") {
        lang = prof.preferred_language;
      }
    }

    if (template_key) {
      const { data: tpl } = await admin
        .from("email_templates")
        .select("*")
        .eq("key", template_key)
        .maybeSingle();
      if (!tpl)
        return new Response(JSON.stringify({ error: `Template ${template_key} not found` }), {
          status: 404,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      if (!tpl.enabled)
        return new Response(JSON.stringify({ ok: true, skipped: "disabled" }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      const fullVars = {
        site_name: settings.site_name ?? "Fidelity",
        site_url: settings.site_url ?? "",
        ...variables,
      };
      const useFr = lang === "fr" && !!tpl.html_body_fr;
      subject = render(useFr ? tpl.subject_fr || tpl.subject : tpl.subject, fullVars);
      html = render(useFr ? tpl.html_body_fr : tpl.html_body, fullVars);
    }

    const port = Number(settings.smtp_port ?? 465);
    // Auto-derive secure: 465 = SSL, others = STARTTLS
    const secure =
      settings.smtp_secure === null || settings.smtp_secure === undefined
        ? port === 465
        : !!settings.smtp_secure;

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port,
      secure,
      auth: { user: settings.smtp_user, pass: settings.smtp_password },
      requireTLS: !secure && port === 587,
      tls: { rejectUnauthorized: true, servername: settings.smtp_host },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const fromName = settings.smtp_from_name || settings.site_name || "Camvcc";
    const fromEmail = settings.smtp_from_email || settings.smtp_user;

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: subject || "(no subject)",
        html: html || "",
      });
      await admin.from("email_logs").insert({
        recipient: to,
        template_key: template_key ?? null,
        subject,
        status: "sent",
      });
      return new Response(JSON.stringify({ ok: true, messageId: info?.messageId }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (sendErr: unknown) {
      const error = sendErr instanceof Error ? sendErr : undefined;
      const errMsg = String(
        (sendErr && typeof sendErr === "object" && "response" in sendErr
          ? (sendErr as { response?: unknown }).response
          : undefined) ??
          error?.message ??
          sendErr,
      );
      await admin.from("email_logs").insert({
        recipient: to,
        template_key: template_key ?? null,
        subject,
        status: "failed",
        error: errMsg,
      });
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
