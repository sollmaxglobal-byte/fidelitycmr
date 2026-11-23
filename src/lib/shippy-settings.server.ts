import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Editable operations settings for the Shippy Express site.
 *
 * Values live in .data/settings.json so the admin console can change them
 * without a redeploy. Environment variables (when provided) always win, so a
 * real secret can replace these defaults at any time.
 */
export type ShippySettings = {
  adminEmail: string;
  adminPasswordHash: string;
  emailFrom: string;
  contactEmail: string;
  tawkEnabled: boolean;
  tawkPropertyId: string;
  tawkWidgetId: string;
};

export type PublicOpsSettings = Omit<ShippySettings, "adminPasswordHash">;

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "settings.json");

export const DEFAULT_ADMIN_EMAIL = "sollmaxglobal@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "Camweb237";

export function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function defaults(): ShippySettings {
  return {
    adminEmail: DEFAULT_ADMIN_EMAIL,
    adminPasswordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    emailFrom: "Shippy Express <onboarding@resend.dev>",
    contactEmail: "support@developerplug.com",
    tawkEnabled: true,
    tawkPropertyId: "",
    tawkWidgetId: "",
  };
}

let cache: ShippySettings | null = null;

async function persist(store: ShippySettings) {
  cache = store;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    // Serverless hosts (e.g. Vercel) ship a read-only filesystem. Keep the
    // values in memory for this instance instead of failing the request.
    console.warn("[shippy-settings] could not persist settings:", error);
  }
}

export async function readSettings(): Promise<ShippySettings> {
  if (cache) return cache;
  const base = defaults();
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<ShippySettings>;
    cache = { ...base, ...raw };
  } catch {
    cache = base;
    await persist(cache);
  }
  return cache;
}

export async function saveSettings(patch: Partial<ShippySettings>): Promise<ShippySettings> {
  const current = await readSettings();
  const next = { ...current, ...patch };
  await persist(next);
  return next;
}

export async function publicSettings(): Promise<PublicOpsSettings> {
  const { adminPasswordHash: _hash, ...rest } = await readSettings();
  return rest;
}

/** Effective credentials — environment values override the stored defaults. */
export async function adminCredentials() {
  const s = await readSettings();
  return {
    email: (process.env.SHIPPY_ADMIN_EMAIL || s.adminEmail).trim().toLowerCase(),
    passwordHash: process.env.SHIPPY_ADMIN_PASSWORD
      ? hashPassword(process.env.SHIPPY_ADMIN_PASSWORD)
      : s.adminPasswordHash,
    emailFrom: process.env.SHIPPY_EMAIL_FROM || s.emailFrom,
    contactEmail: process.env.SHIPPY_CONTACT_EMAIL || s.contactEmail,
  };
}

/** Session token handed to the console after a successful sign-in. */
export async function opsToken() {
  const { passwordHash } = await adminCredentials();
  return createHash("sha256").update(`shippy-ops:${passwordHash}`).digest("hex");
}
