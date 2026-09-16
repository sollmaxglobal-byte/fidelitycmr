/** Parsing helpers for mobile-money confirmation messages (MTN / Orange, FR + EN). */

export type ParsedMessage = {
  txnId: string | null;
  amount: number | null;
  payerNumber: string | null;
};

/** Normalise a transaction reference for comparison: upper-case, alphanumeric only. */
export function normalizeTxnId(value: string | null | undefined): string | null {
  if (!value) return null;
  const norm = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return norm.length >= 4 ? norm : null;
}

/** Turn "5 000,00 FCFA" / "5.000 XAF" / "5000" into 5000. */
export function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : null;
  let text = value.replace(/[^\d.,]/g, "").trim();
  if (!text) return null;
  // Drop decimal part when it is a 1-2 digit cents group.
  text = text.replace(/[.,](\d{1,2})$/, "");
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return null;
  const num = Number(digits);
  return Number.isFinite(num) ? num : null;
}

const TXN_LABELS =
  /(?:transaction\s*(?:id|ID|no|n[o°]|number)|txn\s*id|financial\s*transaction\s*id|ref(?:erence)?|id\s*de\s*transaction|num[ée]ro\s*de\s*transaction)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9.\-_]{4,})/;

const AMOUNT_LABELS =
  /(?:re[çc]u|received|amount|montant|credited|cr[ée]dit[ée]?|deposit(?:ed)?|payment\s*of|paiement\s*de)\s*[:]?\s*([\d][\d\s.,]*)\s*(?:f\s*cfa|fcfa|xaf|frs?|cfa)?/i;

const GENERIC_AMOUNT = /([\d][\d\s.,]{2,})\s*(?:f\s*cfa|fcfa|xaf|frs?|cfa)/i;

const PHONE = /(?:\+?237)?\s?6\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/;
const SENDER_PHONE =
  /(?:from|de|sender|exp[ée]diteur)\s*[:=]?\s*((?:\+?237)?\s?6\d{2}(?:[\s.-]?\d{2}){2,3})/i;
const COMPACT_PHONE = /(?:\+?237)?6\d{8}/;

/** Best-effort extraction of transaction id, amount and payer number from an SMS body. */
export function parseMmMessage(raw: string): ParsedMessage {
  const text = (raw || "").replace(/\s+/g, " ").trim();

  let txnId: string | null = null;
  const labelled = text.match(TXN_LABELS);
  if (labelled?.[1]) txnId = labelled[1];

  if (!txnId) {
    // Fall back to the longest reference-looking token (digits+letters, >= 8 chars).
    const tokens = text.match(/\b[A-Za-z0-9]{8,}\b/g) ?? [];
    const candidates = tokens.filter((tk) => /\d/.test(tk));
    candidates.sort((a, b) => b.length - a.length);
    txnId = candidates[0] ?? null;
  }

  let amount: number | null = null;
  const labelledAmount = text.match(AMOUNT_LABELS);
  if (labelledAmount?.[1]) amount = parseAmount(labelledAmount[1]);
  if (amount === null) {
    const generic = text.match(GENERIC_AMOUNT);
    if (generic?.[1]) amount = parseAmount(generic[1]);
  }

  const phone = text.match(SENDER_PHONE) ?? text.match(PHONE) ?? text.match(COMPACT_PHONE);

  return {
    txnId: normalizeTxnId(txnId),
    amount,
    payerNumber: phone
      ? (phone[1]?.replace(/[\s.-]/g, "") ?? phone[0].replace(/[\s.-]/g, ""))
      : null,
  };
}
