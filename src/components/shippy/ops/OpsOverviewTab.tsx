import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { SHIPMENT_STATUSES } from "@/data/shipments";
import { opsAddUpdate, opsOverview } from "@/lib/shippy.functions";
import { formatStamp } from "@/lib/shippy-format";

type Overview = Awaited<ReturnType<typeof opsOverview>>;

const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function OpsOverviewTab({
  token,
  onExpired,
}: {
  token: string;
  onExpired: () => void;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState("REM-91076436");
  const [update, setUpdate] = useState({ status: "On The Way", location: "", comment: "" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(
    async (activeToken: string) => {
      try {
        const data = await opsOverview({ data: { token: activeToken } });
        setOverview(data);
      } catch {
        onExpired();
      }
    },
    [onExpired],
  );

  useEffect(() => {
    refresh(token);
  }, [token, refresh]);

  if (!overview) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading shipments…</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Shipments</h2>
            <button
              type="button"
              onClick={() => refresh(token)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Tracking</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Subscribers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.shipments.map((shipment) => (
                  <tr
                    key={shipment.trackingNumber}
                    onClick={() => setSelected(shipment.trackingNumber)}
                    className={`cursor-pointer ${
                      selected === shipment.trackingNumber ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <td className="py-2.5 font-semibold text-slate-900">
                      {shipment.trackingNumber}
                    </td>
                    <td className="py-2.5 text-slate-600">{shipment.status}</td>
                    <td className="py-2.5 text-slate-600">
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="py-2.5 text-slate-600">{shipment.subscribers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">New update for {selected}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Publishing an update emails every subscribed customer automatically.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setNotice("");
              setBusy(true);
              try {
                const result = await opsAddUpdate({
                  data: {
                    token,
                    number: selected,
                    status: update.status,
                    location: update.location,
                    comment: update.comment,
                  },
                });
                if (!result.ok) {
                  setNotice(result.message);
                  return;
                }
                setNotice(
                  `Update published. ${result.notified} subscriber${
                    result.notified === 1 ? "" : "s"
                  } notified by email.`,
                );
                setUpdate({ status: update.status, location: "", comment: "" });
                refresh(token);
              } catch (err) {
                const message = (err as Error).message;
                if (/unauthor/i.test(message)) onExpired();
                setNotice(message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="text-sm text-slate-600">
              Status
              <select
                value={update.status}
                onChange={(event) => setUpdate({ ...update, status: event.target.value })}
                className={`${field} mt-1`}
              >
                {SHIPMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Location
              <input
                placeholder="e.g. New York, USA"
                value={update.location}
                onChange={(event) => setUpdate({ ...update, location: event.target.value })}
                className={`${field} mt-1`}
              />
            </label>
            <label className="text-sm text-slate-600 sm:col-span-2">
              Comment
              <input
                placeholder="e.g. Out for final delivery"
                value={update.comment}
                onChange={(event) => setUpdate({ ...update, comment: event.target.value })}
                className={`${field} mt-1`}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> Publish update
              </button>
              <Link
                to="/trackingresult"
                search={{ number: selected }}
                className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View tracking page
              </Link>
            </div>
            {notice && <p className="text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
          </form>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Mail className="h-5 w-5 text-blue-600" /> Notification log
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every tracking update emails all subscribers of that shipment.
          </p>
          <ul className="mt-4 space-y-3">
            {overview.outbox.length === 0 && (
              <li className="text-sm text-slate-500">No notifications sent yet.</li>
            )}
            {overview.outbox.map((mail) => (
              <li key={mail.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">{mail.subject}</p>
                <p className="text-xs text-slate-500">
                  {mail.to} · {formatStamp(mail.createdAt)}
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    mail.status === "sent"
                      ? "bg-emerald-100 text-emerald-700"
                      : mail.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {mail.status === "queued" ? "queued (no provider key)" : mail.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
