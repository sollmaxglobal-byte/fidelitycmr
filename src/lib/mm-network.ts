/** Cameroon mobile-money network detection (client & server safe). */

export type MmNetwork = "mtn" | "orange" | "unknown";

/** Keep the last 9 local digits of a Cameroonian number. */
export function localDigits(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/[^\d]/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

/**
 * MTN Cameroon ranges: 67x, 650-654, 680-689.
 * Orange: 69x, 655-659.
 */
export function detectNetwork(value: string | null | undefined): MmNetwork {
  const n = localDigits(value);
  if (n.length !== 9 || !n.startsWith("6")) return "unknown";
  const p3 = n.slice(0, 3);
  const p2 = n.slice(0, 2);
  if (p2 === "67") return "mtn";
  if (p2 === "69") return "orange";
  if (/^65[0-4]$/.test(p3)) return "mtn";
  if (/^65[5-9]$/.test(p3)) return "orange";
  if (/^68[0-9]$/.test(p3)) return "mtn";
  return "unknown";
}

export function isMtnNumber(value: string | null | undefined): boolean {
  return detectNetwork(value) === "mtn";
}
