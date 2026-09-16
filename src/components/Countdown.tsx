import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms === 0,
  };
}

export function Countdown({ to, compact = false }: { to: string | Date; compact?: boolean }) {
  const target = typeof to === "string" ? new Date(to) : to;
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const i = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (t.done) return <span className="text-xs font-medium text-muted-foreground">Completed</span>;

  if (compact) {
    return (
      <span className="font-mono text-sm font-semibold tabular-nums text-primary">
        {t.days}d {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:
        {String(t.seconds).padStart(2, "0")}
      </span>
    );
  }

  const Box = ({ n, l }: { n: number; l: string }) => (
    <div className="flex flex-col items-center rounded-lg bg-primary/10 px-2 py-1.5 min-w-12">
      <span className="font-mono text-base font-bold tabular-nums text-primary leading-none">
        {String(n).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{l}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <Box n={t.days} l="d" />
      <Box n={t.hours} l="h" />
      <Box n={t.minutes} l="m" />
      <Box n={t.seconds} l="s" />
    </div>
  );
}
