import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type MailServer,
  type ManagerRole,
  type ManagerStatus,
  type PaymentChargeType,
  type PaymentMethodStatus,
  type PaymentMethodType,
  type PaymentMethodUsage,
  type PaymentOption,
  type SmtpEncryption,
} from "@/data/admin";

/**
 * Editable operations settings for the Shippy Express site.
 *
 * Values live in .data/settings.json so the admin console can change them
 * without a redeploy. Environment variables (when provided) always win, so a
 * real secret can replace these defaults at any time.
 */
export type Manager = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ManagerRole;
  status: ManagerStatus;
  passwordHash: string;
  createdAt: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  type: PaymentMethodType;
  usedFor: PaymentMethodUsage;
  status: PaymentMethodStatus;
  currency: string;
  minAmount: number;
  maxAmount: number;
  charges: number;
  chargesType: PaymentChargeType;
  imageUrl: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  walletAddress: string;
  network: string;
  note: string;
};

export type ShippySettings = {
  adminEmail: string;
  adminPasswordHash: string;
  emailFrom: string;
  contactEmail: string;
  tawkEnabled: boolean;
  tawkPropertyId: string;
  tawkWidgetId: string;
  tidioPublicKey: string;
  websiteName: string;
  websiteTitle: string;
  websiteUrl: string;
  officeAddress: string;
  whatsappNumber: string;
  yearStarted: string;
  websiteCurrency: string;
  homepageUrl: string;
  logoUrl: string;
  faviconUrl: string;
  mailServer: MailServer;
  emailFromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpEncryption: SmtpEncryption;
  smtpUsername: string;
  smtpPassword: string;
  depositOption: PaymentOption;
  withdrawalOption: PaymentOption;
  minimumDeposit: number;
  paymentMethods: PaymentMethod[];
  managers: Manager[];
};

export type PublicManager = Omit<Manager, "passwordHash">;
export type PublicOpsSettings = Omit<ShippySettings, "adminPasswordHash" | "managers"> & {
  managers: PublicManager[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "settings.json");

export const DEFAULT_ADMIN_EMAIL = "sollmaxglobal@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "Camweb237";

export function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const defaultPaymentMethods = (): PaymentMethod[] => [
  {
    id: "pm_credit_card",
    name: "Credit Card",
    type: "currency",
    usedFor: "deposit",
    status: "enabled",
    currency: "USD ($)",
    minAmount: 10,
    maxAmount: 10000,
    charges: 2.5,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "",
    note: "",
  },
  {
    id: "pm_busd",
    name: "BUSD",
    type: "crypto",
    usedFor: "both",
    status: "disabled",
    currency: "BUSD",
    minAmount: 10,
    maxAmount: 100000,
    charges: 0,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "BEP20",
    note: "",
  },
  {
    id: "pm_usdt",
    name: "USDT",
    type: "crypto",
    usedFor: "both",
    status: "enabled",
    currency: "USDT",
    minAmount: 10,
    maxAmount: 100000,
    charges: 0,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "TRC20",
    note: "",
  },
  {
    id: "pm_bank_transfer",
    name: "Bank Transfer",
    type: "currency",
    usedFor: "withdrawal",
    status: "enabled",
    currency: "USD ($)",
    minAmount: 50,
    maxAmount: 50000,
    charges: 5,
    chargesType: "fixed",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "",
    note: "",
  },
  {
    id: "pm_paypal",
    name: "Paypal",
    type: "currency",
    usedFor: "deposit",
    status: "disabled",
    currency: "USD ($)",
    minAmount: 10,
    maxAmount: 10000,
    charges: 3,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "",
    note: "",
  },
  {
    id: "pm_litecoin",
    name: "Litecoin",
    type: "crypto",
    usedFor: "both",
    status: "enabled",
    currency: "LTC",
    minAmount: 10,
    maxAmount: 100000,
    charges: 0,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "",
    note: "",
  },
  {
    id: "pm_ethereum",
    name: "Ethereum",
    type: "crypto",
    usedFor: "both",
    status: "enabled",
    currency: "ETH",
    minAmount: 10,
    maxAmount: 100000,
    charges: 0,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "ERC20",
    note: "",
  },
  {
    id: "pm_bitcoin",
    name: "Bitcoin",
    type: "crypto",
    usedFor: "both",
    status: "enabled",
    currency: "BTC",
    minAmount: 10,
    maxAmount: 100000,
    charges: 0,
    chargesType: "percentage",
    imageUrl: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    walletAddress: "",
    network: "Bitcoin",
    note: "",
  },
];

const defaultManagers = (): Manager[] => [
  {
    id: "mgr_reference",
    firstName: "Ofofonobs",
    lastName: "Developer",
    email: "admin@admin.com",
    phone: "2348114313795",
    role: "Super Admin",
    status: "active",
    passwordHash: hashPassword("12345678"),
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

function defaults(): ShippySettings {
  return {
    adminEmail: DEFAULT_ADMIN_EMAIL,
    adminPasswordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    emailFrom: "Shippy Express <onboarding@resend.dev>",
    contactEmail: "support@developerplug.com",
    tawkEnabled: true,
    tawkPropertyId: "",
    tawkWidgetId: "",
    tidioPublicKey: "",
    websiteName: "Shippy Express",
    websiteTitle: "Shippy Express — Premium Global Shipping Solutions",
    websiteUrl: "https://shippyexpress.developersplug.com",
    officeAddress: "Global Logistics Hub, 24 Harbour Road, Lagos, Nigeria",
    whatsappNumber: "2348114313795",
    yearStarted: "2024",
    websiteCurrency: "USD ($)",
    homepageUrl: "",
    logoUrl: "",
    faviconUrl: "",
    mailServer: "sendmail",
    emailFromName: "Shippy Express",
    smtpHost: "",
    smtpPort: "465",
    smtpEncryption: "ssl",
    smtpUsername: "",
    smtpPassword: "",
    depositOption: "manual",
    withdrawalOption: "manual",
    minimumDeposit: 100,
    paymentMethods: defaultPaymentMethods(),
    managers: defaultManagers(),
  };
}

let cache: ShippySettings | null = null;

async function persist(store: ShippySettings) {
  cache = store;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
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
  const { adminPasswordHash: _hash, managers, ...rest } = await readSettings();
  return {
    ...rest,
    managers: managers.map(({ passwordHash: _password, ...manager }) => manager),
  };
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
