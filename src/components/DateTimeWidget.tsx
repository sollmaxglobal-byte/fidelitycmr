import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(d: Date) {
  const day = DAYS[d.getDay()];
  const date = String(d.getDate()).padStart(2, "0");
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours24 = d.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hh = String(hours24 % 12 || 12).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return { date: `${day}, ${date} ${month} ${year}`, time: `${hh}:${mm}:${ss} ${period}` };
}

export function DateTimeWidget() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const { date, time } = fmt(now);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Clock className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
          <div className="text-sm font-medium text-foreground">{date}</div>
        </div>
      </div>
      <div className="font-display text-xl font-bold uppercase tabular-nums text-primary">
        {time}
      </div>
    </div>
  );
}
