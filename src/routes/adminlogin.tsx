import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, LogOut, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { SHIPMENT_STATUSES } from "@/data/shipments";
import { opsAddUpdate, opsLogin, opsOverview } from "@/lib/shippy.functions";
import { formatStamp } from "@/lib/shippy-format";
import { ShippyLayout } from "@/components/shippy/ShippyLayout";

export const Route = createFileRoute("/adminlogin")({
  head: () => ({
    meta: [
      { title: "Operations Console — Shippy Express" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

type Overview = Awaited<ReturnType<typeof opsOverview>>;

const TOKEN_KEY = "shippy_ops_token";
const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

function AdminLoginPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selected, setSelected] = useState("REM-91076436");
  const [update, setUpdate] = useState({
    status: "On The Way",
    location: "",
    comment: "",
  });
  const [notice, setNotice] = useState("");

  const refresh = async (activeToken: string) => {
    try {
      const data = await opsOverview({ data: { token: activeToken } });
      setOverview(data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setError("Session expired. Please sign in again.");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      refresh(saved);
    }
  }, []);

  if (!token) {
    return (
      <ShippyLayout>
        <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">
              Operations Console
            </h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Sign in to publish shipment updates and trigger customer email notifications.
            </p>
            <form
              className="mt-6 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setLoading(true);
                setError("");
                try {
                  const result = await opsLogin({ data: { password } });
                  if (!result.ok) {
                    setError(result.message);
                    return;
                  }
                  localStorage.setItem(TOKEN_KEY, result.token);
                  setToken(result.token);
                  setPassword("");
                  refresh(result.token);
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <input
                type="password"
                required
                autoFocus
                placeholder="Admin password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={field}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-center text-xs text-slate-500">
                Demo password: <strong className="text-slate-700">12345678</strong>
              </p>
            </form>
          </div>
        </section>
      </ShippyLayout>
    );
  }

  const selectedShipment = overview?.shipments.find((s) => s.trackingNumber === selected);

  return (
    <ShippyLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shipment Operations</h1>
            <p className="mt-1 text-slate-600">
              Publish a tracking update — every subscribed customer is emailed automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refresh(token)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
                setOverview(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {!overview && <p className="mt-8 text-slate-500">Loading shipments…</p>}

        {overview && (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tracking</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Subscribers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.shipments.map((shipment) => (
                      <tr
                        key={shipment.trackingNumber}
                        onClick={() => setSelected(shipment.trackingNumber)}
                        className={`cursor-pointer border-t border-slate-100 hover:bg-blue-50/60 ${
                          selected === shipment.trackingNumber ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {shipment.trackingNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{shipment.status}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {shipment.origin} → {shipment.destination}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{shipment.subscribers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  New update {selectedShipment ? `for ${selectedShipment.trackingNumber}` : ""}
                </h2>
                <form
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setNotice("");
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
                      setNotice((err as Error).message);
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
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
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

            <div className="lg:col-span-2">
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
                    <li
                      key={mail.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
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
        )}
      </section>
    </ShippyLayout>
  );
}
