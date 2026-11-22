import { promises as fs } from "node:fs";
import path from "node:path";
import {
  seedShipments,
  type Place,
  type Shipment,
  type ShipmentStatus,
  type TrackingEvent,
} from "@/data/shipments";
import { seedDeposits, type Deposit, type DepositStatus } from "@/data/deposits";
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

type Store = {
  shipments: Shipment[];
  subscribers: Subscriber[];
  outbox: OutboxItem[];
  deposits: Deposit[];
};

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
      deposits: parsed.deposits?.length ? parsed.deposits : seedDeposits,
    };
  } catch {
    cache = {
      shipments: seedShipments,
      subscribers: [],
      outbox: [],
      deposits: seedDeposits,
    };
    await persist(cache);
  }
  return cache;
}

async function persist(store: Store) {
  cache = store;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
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

export async function listDeposits() {
  const store = await load();
  return [...store.deposits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function updateDepositStatus(id: string, status: DepositStatus) {
  const store = await load();
  const deposit = store.deposits.find((item) => item.id === id);
  if (!deposit) return { ok: false as const, message: "Deposit not found." };
  deposit.status = status;
  await persist(store);
  return { ok: true as const, deposit };
}

export async function deleteDeposit(id: string) {
  const store = await load();
  const before = store.deposits.length;
  store.deposits = store.deposits.filter((item) => item.id !== id);
  if (store.deposits.length === before) {
    return { ok: false as const, message: "Deposit not found." };
  }
  await persist(store);
  return { ok: true as const };
}

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  shipments: number;
  lastActivity: string;
  records: {
    trackingNumber: string;
    status: ShipmentStatus;
    route: string;
    updatedAt: string;
  }[];
};

export async function adminCustomers(): Promise<AdminCustomer[]> {
  const store = await load();
  const map = new Map<string, AdminCustomer>();

  const addPerson = (
    person: { name: string; email?: string; phone: string },
    role: string,
    shipment: Shipment,
  ) => {
    const email = (person.email ?? "").trim().toLowerCase();
    const phone = (person.phone ?? "").trim();
    const name = (person.name ?? "").trim();
    if (!email && !phone && (!name || name === "—")) return;
    const key = email || phone || name.toLowerCase();
    const existing =
      map.get(key) ??
      ({
        id: key,
        name: name || "Customer",
        email,
        phone,
        roles: [],
        shipments: 0,
        lastActivity: shipment.updatedAt,
        records: [],
      } satisfies AdminCustomer);

    if ((!existing.name || existing.name === "—") && name) existing.name = name;
    if (!existing.email && email) existing.email = email;
    if (!existing.phone && phone) existing.phone = phone;
    if (!existing.roles.includes(role)) existing.roles.push(role);
    if (!existing.records.some((record) => record.trackingNumber === shipment.trackingNumber)) {
      existing.shipments += 1;
      existing.records.push({
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        route: `${shipment.origin.label} → ${shipment.destination.label}`,
        updatedAt: shipment.updatedAt,
      });
    }
    if (new Date(shipment.updatedAt) > new Date(existing.lastActivity)) {
      existing.lastActivity = shipment.updatedAt;
    }
    map.set(key, existing);
  };

  for (const shipment of store.shipments) {
    addPerson({ name: shipment.sender.name, phone: shipment.sender.phone }, "Sender", shipment);
    addPerson(
      {
        name: shipment.recipient.name,
        email: shipment.recipient.email,
        phone: shipment.recipient.phone,
      },
      "Recipient",
      shipment,
    );
  }

  for (const subscriber of store.subscribers) {
    const key = subscriber.email.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      if (!existing.roles.includes("Subscriber")) existing.roles.push("Subscriber");
    } else {
      map.set(key, {
        id: key,
        name: "Subscriber",
        email: key,
        phone: "",
        roles: ["Subscriber"],
        shipments: 0,
        lastActivity: subscriber.createdAt,
        records: [],
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendBroadcast(input: {
  recipients: string[];
  subject: string;
  greeting: string;
  message: string;
}) {
  const store = await load();
  const paragraphs = input.message
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:14px;color:#334155;line-height:1.65">${escapeHtml(
          paragraph,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a">
    <p style="margin:0 0 14px;font-size:14px;color:#334155">${escapeHtml(
      input.greeting || "Hello,",
    )}</p>
    ${paragraphs}
    <p style="margin:22px 0 0;font-size:13px;color:#64748b">— Shippy Express</p>
  </div>`;

  const result = { sent: 0, queued: 0, failed: 0, total: input.recipients.length };

  for (const to of input.recipients) {
    const mail = await deliverMail({ to, subject: input.subject, html });
    if (mail.status === "sent") result.sent += 1;
    else if (mail.status === "queued") result.queued += 1;
    else result.failed += 1;
    store.outbox.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      to,
      subject: input.subject,
      status: mail.status,
      createdAt: new Date().toISOString(),
      error: mail.error,
    });
  }

  store.outbox = store.outbox.slice(0, 80);
  await persist(store);
  return result;
}

export async function adminOverview() {
  const store = await load();
  const customerKeys = new Set<string>();
  for (const shipment of store.shipments) {
    if (shipment.recipient.email) customerKeys.add(shipment.recipient.email.toLowerCase());
    if (shipment.recipient.phone) customerKeys.add(shipment.recipient.phone);
    if (shipment.sender.phone) customerKeys.add(shipment.sender.phone);
  }

  const deposits = store.deposits;
  const stats = {
    totalShipments: store.shipments.length,
    inTransit: store.shipments.filter(
      (s) => s.status === "On The Way" || s.status === "Picked by Courier",
    ).length,
    delivered: store.shipments.filter((s) => s.status === "Delivered").length,
    customers: customerKeys.size,
    pendingDeposits: deposits.filter((d) => d.status === "Pending").length,
    pendingDepositAmount: deposits
      .filter((d) => d.status === "Pending")
      .reduce((sum, d) => sum + d.amount, 0),
    totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0),
  };

  return {
    shipments: store.shipments.map((s) => ({
      trackingNumber: s.trackingNumber,
      status: s.status,
      mode: s.mode,
      createdAt: s.shippedAt,
      updatedAt: s.updatedAt,
      expectedAt: s.expectedAt,
      origin: s.origin.label,
      destination: s.destination.label,
      senderName: s.sender.name,
      senderPhone: s.sender.phone,
      recipientName: s.recipient.name,
      recipientPhone: s.recipient.phone,
      recipientEmail: s.recipient.email ?? "",
      subscribers: store.subscribers.filter(
        (sub) => normalise(sub.trackingNumber) === normalise(s.trackingNumber),
      ).length,
      events: s.events.length,
    })),
    outbox: store.outbox.slice(0, 12),
    stats,
  };
}
