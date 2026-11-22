import { useState } from "react";
import { BellRing, Loader2, Mail } from "lucide-react";
import { subscribeToUpdates } from "@/lib/shippy.functions";

export function EmailUpdates({ trackingNumber }: { trackingNumber: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{
    status: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({ status: "idle" });

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900">Email notifications</h3>
          <p className="mt-1 text-sm text-slate-600">
            Get an email every time shipment <strong>{trackingNumber}</strong> changes status.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              setState({ status: "loading" });
              try {
                const result = await subscribeToUpdates({
                  data: { number: trackingNumber, email },
                });
                if (!result.ok) {
                  setState({ status: "error", message: result.message });
                  return;
                }
                setState({ status: "ok", message: result.message });
                setEmail("");
              } catch (error) {
                setState({
                  status: "error",
                  message: (error as Error).message || "Could not save your subscription.",
                });
              }
            }}
          >
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              Notify me
            </button>
          </form>
          {state.message && (
            <p
              className={`mt-3 text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-700"}`}
            >
              {state.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
