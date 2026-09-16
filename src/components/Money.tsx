import { formatXAF } from "@/lib/format";

/** Renders an XAF amount in bold uppercase (symbol + value together, never wraps). */
export function Money({
  value,
  className = "",
}: {
  value: number | string | null | undefined;
  className?: string;
}) {
  // Use a non-breaking-space thousands separator so the number never wraps mid-value on small screens.
  const formatted = formatXAF(value).replace(/ /g, "\u00A0");
  return (
    <span
      className={`font-sans font-bold uppercase tracking-wide tabular-nums whitespace-nowrap ${className}`}
    >
      {formatted}
    </span>
  );
}
