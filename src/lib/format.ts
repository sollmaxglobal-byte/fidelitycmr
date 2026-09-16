// Deterministic formatting (no Intl) to avoid SSR/CSR hydration mismatches
// caused by different ICU versions on server vs client.

export function formatXAF(n: number | string | null | undefined): string {
  const num = Math.round(Number(n ?? 0));
  const abs = Math.abs(num);
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${num < 0 ? "-" : ""}${grouped} XAF`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  const day = String(dt.getUTCDate()).padStart(2, "0");
  const month = MONTHS[dt.getUTCMonth()];
  const year = dt.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** Short, human-friendly transaction reference derived from a UUID. */
export function txRef(id: string | null | undefined): string {
  if (!id) return "—";
  return id.replace(/-/g, "").slice(0, 12).toUpperCase();
}
