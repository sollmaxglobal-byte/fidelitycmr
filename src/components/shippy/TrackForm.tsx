import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

type Variant = "hero" | "footer" | "page";

const styles: Record<Variant, { form: string; input: string; button: string }> = {
  hero: {
    form: "flex flex-col gap-3 sm:flex-row",
    input:
      "w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
    button:
      "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700",
  },
  page: {
    form: "flex flex-col gap-3 sm:flex-row",
    input:
      "w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
    button:
      "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700",
  },
  footer: {
    form: "flex flex-col gap-2",
    input:
      "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500",
    button:
      "inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
  },
};

export function TrackForm({
  variant = "hero",
  defaultValue = "",
}: {
  variant?: Variant;
  defaultValue?: string;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);
  const s = styles[variant];

  return (
    <form
      className={s.form}
      method="get"
      action="/trackingresult"
      onSubmit={(event) => {
        event.preventDefault();
        const number = value.trim();
        if (!number) return;
        navigate({ to: "/trackingresult", search: { number } });
      }}
    >
      <input
        name="number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter tracking number..."
        aria-label="Tracking number"
        className={s.input}
        required
      />
      <button type="submit" className={s.button}>
        <Search className="h-4 w-4" />
        Track
      </button>
    </form>
  );
}
