import { timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { SHIPMENT_STATUSES, SHIPPY_HUBS, type ShipmentStatus } from "@/data/shipments";

const trackingNumber = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 40);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function assertOpsToken(token: unknown) {
  const { opsToken } = await import("@/lib/shippy-settings.server");
  const provided = String(token ?? "");
  const expected = await opsToken();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Unauthorized");
  }
}

export const getShipment = createServerFn({ method: "GET" })
  .inputValidator((data: { number: string }) => ({ number: trackingNumber(data.number) }))
  .handler(async ({ data }) => {
    const { findShipment } = await import("@/lib/shipments.server");
    return findShipment(data.number);
  });

export const subscribeToUpdates = createServerFn({ method: "POST" })
  .inputValidator((data: { number: string; email: string }) => {
    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
    return { number: trackingNumber(data.number), email: email.slice(0, 120) };
  })
  .handler(async ({ data }) => {
    const { addSubscriber } = await import("@/lib/shipments.server");
    return addSubscriber(data.number, data.email);
  });

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { name: string; email: string; phone: string; subject: string; message: string }) => {
      const email = String(data.email ?? "")
        .trim()
        .toLowerCase();
      if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
      const name = String(data.name ?? "")
        .trim()
        .slice(0, 80);
      const message = String(data.message ?? "")
        .trim()
        .slice(0, 2000);
      if (!name || message.length < 5) throw new Error("Please add your name and a short message.");
      return {
        name,
        email,
        phone: String(data.phone ?? "")
          .trim()
          .slice(0, 40),
        subject: String(data.subject ?? "")
          .trim()
          .slice(0, 120),
        message,
      };
    },
  )
  .handler(async ({ data }) => {
    const { deliverMail } = await import("@/lib/shippy-mail.server");
    const { adminCredentials } = await import("@/lib/shippy-settings.server");
    const { contactEmail } = await adminCredentials();
    const result = await deliverMail({
      to: contactEmail || "support@developerplug.com",
      subject: `Website enquiry: ${data.subject || "General enquiry"}`,
      html: `<p><strong>${escapeHtml(data.name)}</strong> (${escapeHtml(data.email)}${
        data.phone ? `, ${escapeHtml(data.phone)}` : ""
      }) wrote:</p><p>${escapeHtml(data.message)}</p>`,
    });
    return { ok: true as const, status: result.status };
  });

export const opsLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => ({
    email: String(data.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 120),
    password: String(data.password ?? "").slice(0, 120),
  }))
  .handler(async ({ data }) => {
    const { adminCredentials, hashPassword, opsToken } = await import(
      "@/lib/shippy-settings.server"
    );
    const creds = await adminCredentials();
    if (data.email !== creds.email || hashPassword(data.password) !== creds.passwordHash) {
      return { ok: false as const, message: "Incorrect email or password." };
    }
    return { ok: true as const, token: await opsToken() };
  });

export const opsOverview = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token ?? "") }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { adminOverview } = await import("@/lib/shipments.server");
    return adminOverview();
  });

export const opsAddUpdate = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      number: string;
      status: string;
      location: string;
      comment: string;
    }) => {
      if (!SHIPMENT_STATUSES.includes(data.status as ShipmentStatus)) {
        throw new Error("Choose a valid status.");
      }
      return {
        token: String(data.token ?? ""),
        number: trackingNumber(data.number),
        status: data.status as ShipmentStatus,
        location: String(data.location ?? "")
          .trim()
          .slice(0, 120),
        comment: String(data.comment ?? "")
          .trim()
          .slice(0, 300),
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { addTrackingUpdate } = await import("@/lib/shipments.server");
    return addTrackingUpdate({
      trackingNumber: data.number,
      status: data.status,
      location: data.location,
      comment: data.comment,
    });
  });

const hubByLabel = new Map(SHIPPY_HUBS.map((hub) => [hub.label, hub]));

const text = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

export const opsCreateShipment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      number: string;
      status: string;
      mode: string;
      originLabel: string;
      destinationLabel: string;
      weightKg: number;
      pieces: number;
      dimensions: string;
      expectedAt: string;
      senderName: string;
      senderPhone: string;
      recipientName: string;
      recipientPhone: string;
      recipientEmail: string;
      comment: string;
    }) => {
      const origin = hubByLabel.get(text(data.originLabel, 80));
      const destination = hubByLabel.get(text(data.destinationLabel, 80));
      if (!origin || !destination) throw new Error("Choose a valid origin and destination hub.");
      const number = trackingNumber(data.number);
      if (number.length < 4) throw new Error("Enter a tracking number.");
      if (!SHIPMENT_STATUSES.includes(data.status as ShipmentStatus)) {
        throw new Error("Choose a valid status.");
      }
      const email = text(data.recipientEmail, 120).toLowerCase();
      if (email && !EMAIL_RE.test(email)) throw new Error("Enter a valid recipient email.");
      const expected = text(data.expectedAt, 40);
      return {
        token: text(data.token, 200),
        trackingNumber: number,
        status: data.status as ShipmentStatus,
        mode: text(data.mode, 40) || "Air Freight",
        origin,
        destination,
        weightKg: Number.isFinite(Number(data.weightKg)) ? Math.max(0, Number(data.weightKg)) : 0,
        pieces: Number.isFinite(Number(data.pieces)) ? Math.max(1, Number(data.pieces)) : 1,
        dimensions: text(data.dimensions, 60),
        expectedAt: expected ? new Date(expected).toISOString() : new Date().toISOString(),
        senderName: text(data.senderName, 80),
        senderPhone: text(data.senderPhone, 40),
        recipientName: text(data.recipientName, 80),
        recipientPhone: text(data.recipientPhone, 40),
        recipientEmail: email,
        comment: text(data.comment, 300),
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { createShipment } = await import("@/lib/shipments.server");
    const { token: _token, ...input } = data;
    return createShipment(input);
  });

export const opsSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: text(data.token, 200) }))
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { publicSettings } = await import("@/lib/shippy-settings.server");
    return publicSettings();
  });

export const opsSaveSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      adminEmail: string;
      emailFrom: string;
      contactEmail: string;
      tawkEnabled: boolean;
      tawkPropertyId: string;
      tawkWidgetId: string;
      newPassword: string;
    }) => {
      const adminEmail = text(data.adminEmail, 120).toLowerCase();
      if (!EMAIL_RE.test(adminEmail)) throw new Error("Enter a valid admin email address.");
      const contactEmail = text(data.contactEmail, 120).toLowerCase();
      if (contactEmail && !EMAIL_RE.test(contactEmail)) {
        throw new Error("Enter a valid contact email address.");
      }
      const newPassword = String(data.newPassword ?? "");
      if (newPassword && newPassword.length < 6) {
        throw new Error("The new password must be at least 6 characters.");
      }
      return {
        token: text(data.token, 200),
        adminEmail,
        emailFrom: text(data.emailFrom, 160),
        contactEmail,
        tawkEnabled: data.tawkEnabled === true,
        tawkPropertyId: text(data.tawkPropertyId, 60),
        tawkWidgetId: text(data.tawkWidgetId, 60),
        newPassword,
      };
    },
  )
  .handler(async ({ data }) => {
    await assertOpsToken(data.token);
    const { hashPassword, opsToken, saveSettings } = await import("@/lib/shippy-settings.server");
    await saveSettings({
      adminEmail: data.adminEmail,
      emailFrom: data.emailFrom,
      contactEmail: data.contactEmail,
      tawkEnabled: data.tawkEnabled,
      tawkPropertyId: data.tawkPropertyId,
      tawkWidgetId: data.tawkWidgetId,
      ...(data.newPassword ? { adminPasswordHash: hashPassword(data.newPassword) } : {}),
    });
    return { ok: true as const, token: await opsToken() };
  });

export const getChatWidget = createServerFn({ method: "GET" }).handler(async () => {
  const { readSettings } = await import("@/lib/shippy-settings.server");
  const settings = await readSettings();
  return {
    enabled: settings.tawkEnabled !== false,
    propertyId: settings.tawkPropertyId.trim(),
    widgetId: settings.tawkWidgetId.trim() || "default",
  };
});
