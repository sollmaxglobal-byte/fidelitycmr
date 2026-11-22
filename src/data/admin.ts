/** Client-safe constants shared by the admin console and its server functions. */

export const MANAGER_ROLES = ["Super Admin", "Admin", "Conversion Agent"] as const;
export type ManagerRole = (typeof MANAGER_ROLES)[number];

export const MANAGER_STATUSES = ["active", "blocked"] as const;
export type ManagerStatus = (typeof MANAGER_STATUSES)[number];

export const PAYMENT_METHOD_TYPES = ["currency", "crypto"] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const PAYMENT_METHOD_USAGE = ["deposit", "withdrawal", "both"] as const;
export type PaymentMethodUsage = (typeof PAYMENT_METHOD_USAGE)[number];

export const PAYMENT_METHOD_STATUSES = ["enabled", "disabled"] as const;
export type PaymentMethodStatus = (typeof PAYMENT_METHOD_STATUSES)[number];

export const PAYMENT_OPTIONS = ["auto", "manual", "automatic"] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];

export const PAYMENT_CHARGE_TYPES = ["percentage", "fixed"] as const;
export type PaymentChargeType = (typeof PAYMENT_CHARGE_TYPES)[number];

export const MAIL_SERVERS = ["sendmail", "smtp"] as const;
export type MailServer = (typeof MAIL_SERVERS)[number];

export const SMTP_ENCRYPTIONS = ["ssl", "tls", "none"] as const;
export type SmtpEncryption = (typeof SMTP_ENCRYPTIONS)[number];

export const CURRENCIES = [
  "USD ($)",
  "EUR (€)",
  "GBP (£)",
  "NGN (₦)",
  "XAF (FCFA)",
  "CAD ($)",
  "AUD ($)",
  "GHS (¢)",
  "KES (KSh)",
  "ZAR (R)",
  "INR (₹)",
  "AED (د.إ)",
] as const;
