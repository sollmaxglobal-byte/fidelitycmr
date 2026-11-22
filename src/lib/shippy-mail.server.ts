import type { Shipment, TrackingEvent } from "@/data/shipments";

export type MailResult = { status: "sent" | "queued" | "failed"; error?: string };

const FROM = process.env.SHIPPY_EMAIL_FROM || "Shippy Express <onboarding@resend.dev>";

/**
 * Delivers an email through Resend when RESEND_API_KEY is configured.
 * Without a provider key the message is kept as "queued" so the operations
 * dashboard can show exactly what would have been sent.
 */
export async function deliverMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "queued" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      return { status: "failed", error: `Provider responded ${res.status}` };
    }
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: (error as Error).message };
  }
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:#1d4ed8;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:700">Shippy Express</td></tr>
        <tr><td style="padding:26px 24px">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:18px 24px;background:#f8fafc;color:#64748b;font-size:12px">
          Shippy Express — Providing smart logistics solutions across the world.
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:130px">${label}</td><td style="padding:6px 0;font-size:14px;font-weight:600">${value}</td></tr>`;
}

export function updateEmail(shipment: Shipment, event: TrackingEvent) {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155">Your shipment <strong>${shipment.trackingNumber}</strong> has a new update.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
      ${detailRow("Status", event.status)}
      ${detailRow("Location", event.location)}
      ${detailRow("Note", event.comment || "—")}
      ${detailRow("Updated", new Date(event.at).toUTCString())}
    </table>
    <p style="margin:18px 0 0;font-size:14px;color:#334155">Track live progress any time with your tracking number.</p>`;
  return {
    subject: `Shipment ${shipment.trackingNumber}: ${event.status}`,
    html: shell("Shipment update", body),
  };
}

export function confirmationEmail(shipment: Shipment) {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155">You are now subscribed to email updates for <strong>${shipment.trackingNumber}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
      ${detailRow("Current status", shipment.status)}
      ${detailRow("Origin", shipment.origin.label)}
      ${detailRow("Destination", shipment.destination.label)}
    </table>
    <p style="margin:18px 0 0;font-size:14px;color:#334155">We will email you every time the status of this shipment changes.</p>`;
  return {
    subject: `Tracking updates enabled for ${shipment.trackingNumber}`,
    html: shell("You're subscribed", body),
  };
}
