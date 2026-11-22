import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "@/data/shipments";

const trackingNumber = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 40);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function expectedToken() {
  const password = process.env.SHIPPY_ADMIN_PASSWORD || "12345678";
  return createHash("sha256").update(`shippy-ops:${password}`).digest("hex");
}

function assertOpsToken(token: unknown) {
  const provided = String(token ?? "");
  const expected = expectedToken();
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
    const result = await deliverMail({
      to: process.env.SHIPPY_CONTACT_EMAIL || "support@developerplug.com",
      subject: `Website enquiry: ${data.subject || "General enquiry"}`,
      html: `<p><strong>${escapeHtml(data.name)}</strong> (${escapeHtml(data.email)}${
        data.phone ? `, ${escapeHtml(data.phone)}` : ""
      }) wrote:</p><p>${escapeHtml(data.message)}</p>`,
    });
    return { ok: true as const, status: result.status };
  });

export const opsLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({
    password: String(data.password ?? "").slice(0, 120),
  }))
  .handler(async ({ data }) => {
    const expected = process.env.SHIPPY_ADMIN_PASSWORD || "12345678";
    if (data.password !== expected) return { ok: false as const, message: "Incorrect password." };
    return { ok: true as const, token: expectedToken() };
  });

export const opsOverview = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => {
    assertOpsToken(data.token);
    return { token: data.token };
  })
  .handler(async () => {
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
      assertOpsToken(data.token);
      if (!SHIPMENT_STATUSES.includes(data.status as ShipmentStatus)) {
        throw new Error("Choose a valid status.");
      }
      return {
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
    const { addTrackingUpdate } = await import("@/lib/shipments.server");
    return addTrackingUpdate({
      trackingNumber: data.number,
      status: data.status,
      location: data.location,
      comment: data.comment,
    });
  });
