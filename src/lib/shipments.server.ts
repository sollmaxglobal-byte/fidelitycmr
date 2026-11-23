import { promises as fs } from "node:fs";
import path from "node:path";
import {
  seedShipments,
  type Place,
  type Shipment,
  type ShipmentStatus,
  type TrackingEvent,
} from "@/data/shipments";
import { confirmationEmail, deliverMail, updateEmail } from "@/lib/shippy-mail.server";

export type Subscriber = { email: string; trackingNumber: string; createdAt: string };
export type OutboxItem = {
  id: string;
  to: string;
  subject: string;
  status: "sent" | "queued" | "failed";
  createdAt: string;
  error?: string;
};

type Store = { shipments: Shipment[]; subscribers: Subscriber[]; outbox: OutboxItem[] };

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "shipments.json");

let cache: Store | null = null;

async function load(): Promise<Store> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Store;
    cache = {
      shipments: parsed.shipments?.length ? parsed.shipments : seedShipments,
      subscribers: parsed.subscribers ?? [],
      outbox: parsed.outbox ?? [],
    };
  } catch {
    cache = { shipments: seedShipments, subscribers: [], outbox: [] };
    await persist(cache);
  }
  return cache;
}

async function persist(store: Store) {
  cache = store;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    // Serverless hosts (e.g. Vercel) ship a read-only filesystem. Keep the
    // values in memory for this instance instead of failing the request.
    console.warn("[shipments] could not persist store:", error);
  }
}

function normalise(value: string) {
  return value.trim().toUpperCase();
}

export async function findShipment(trackingNumber: string) {
  const store = await load();
  const shipment = store.shipments.find(
    (s) => normalise(s.trackingNumber) === normalise(trackingNumber),
  );
  if (!shipment) return { found: false as const };
  return {
    found: true as const,
    shipment,
    subscribers: store.subscribers.filter(
      (s) => normalise(s.trackingNumber) === normalise(shipment.trackingNumber),
    ).length,
  };
}

export async function addSubscriber(trackingNumber: string, email: string) {
  const store = await load();
  const shipment = store.shipments.find(
    (s) => normalise(s.trackingNumber) === normalise(trackingNumber),
  );
  if (!shipment) return { ok: false as const, message: "Tracking number not found." };

  const exists = store.subscribers.some(
    (s) => normalise(s.trackingNumber) === normalise(shipment.trackingNumber) && s.email === email,
  );
  if (!exists) {
    store.subscribers.push({
      email,
      trackingNumber: shipment.trackingNumber,
      createdAt: new Date().toISOString(),
    });
  }

  const mail = confirmationEmail(shipment);
  const result = await deliverMail({ to: email, subject: mail.subject, html: mail.html });
  store.outbox.unshift({
    id: `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    to: email,
    subject: mail.subject,
    status: result.status,
    createdAt: new Date().toISOString(),
    error: result.error,
  });
  store.outbox = store.outbox.slice(0, 40);
  await persist(store);

  return {
    ok: true as const,
    alreadySubscribed: exists,
    emailStatus: result.status,
    message: exists
      ? "This email is already subscribed to updates."
      : result.status === "sent"
        ? "Confirmation email sent. You will be notified on every update."
        : "You are subscribed. A confirmation email has been queued.",
  };
}

export async function createShipment(input: {
  trackingNumber: string;
  status: ShipmentStatus;
  mode: string;
  origin: Place;
  destination: Place;
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
}) {
  const store = await load();
  const exists = store.shipments.some(
    (s) => normalise(s.trackingNumber) === normalise(input.trackingNumber),
  );
  if (exists) return { ok: false as const, message: "That tracking number already exists." };

  const now = new Date().toISOString();
  const shipment: Shipment = {
    trackingNumber: input.trackingNumber,
    status: input.status,
    mode: input.mode,
    weightKg: input.weightKg,
    pieces: input.pieces,
    dimensions: input.dimensions || "—",
    shippedAt: now,
    pickupAt: now,
    expectedAt: input.expectedAt,
    updatedAt: now,
    origin: input.origin,
    current: input.origin,
    destination: input.destination,
    sender: {
      name: input.senderName || "—",
      address: input.origin.label,
      phone: input.senderPhone || "—",
    },
    recipient: {
      name: input.recipientName || "—",
      address: input.destination.label,
      phone: input.recipientPhone || "—",
      email: input.recipientEmail || undefined,
    },
    dutyFee: 0,
    dutyPaid: false,
    events: [
      {
        id: `${input.trackingNumber}-${Date.now()}`,
        status: input.status,
        location: input.origin.label,
        comment: input.comment || "Shipment registered in the operations console.",
        at: now,
      },
    ],
  };

  store.shipments.unshift(shipment);
  await persist(store);
  return { ok: true as const, shipment };
}

export async function addTrackingUpdate(input: {
  trackingNumber: string;
  status: ShipmentStatus;
  location: string;
  comment: string;
}) {
  const store = await load();
  const shipment = store.shipments.find(
    (s) => normalise(s.trackingNumber) === normalise(input.trackingNumber),
  );
  if (!shipment) return { ok: false as const, message: "Tracking number not found." };

  const event: TrackingEvent = {
    id: `${shipment.trackingNumber}-${Date.now()}`,
    status: input.status,
    location: input.location || shipment.current.label,
    comment: input.comment,
    at: new Date().toISOString(),
  };

  shipment.events.unshift(event);
  shipment.status = input.status;
  shipment.updatedAt = event.at;
  if (input.location) {
    shipment.current = { ...shipment.current, label: input.location };
  }
  if (input.status === "Delivered") {
    shipment.current = shipment.destination;
  }

  const mail = updateEmail(shipment, event);
  const recipients = store.subscribers.filter(
    (s) => normalise(s.trackingNumber) === normalise(shipment.trackingNumber),
  );

  for (const recipient of recipients) {
    const result = await deliverMail({
      to: recipient.email,
      subject: mail.subject,
      html: mail.html,
    });
    store.outbox.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      to: recipient.email,
      subject: mail.subject,
      status: result.status,
      createdAt: new Date().toISOString(),
      error: result.error,
    });
  }
  store.outbox = store.outbox.slice(0, 40);
  await persist(store);

  return { ok: true as const, shipment, notified: recipients.length };
}

export async function adminOverview() {
  const store = await load();
  return {
    shipments: store.shipments.map((s) => ({
      trackingNumber: s.trackingNumber,
      status: s.status,
      updatedAt: s.updatedAt,
      origin: s.origin.label,
      destination: s.destination.label,
      subscribers: store.subscribers.filter(
        (sub) => normalise(sub.trackingNumber) === normalise(s.trackingNumber),
      ).length,
      events: s.events.length,
    })),
    outbox: store.outbox.slice(0, 12),
  };
}
