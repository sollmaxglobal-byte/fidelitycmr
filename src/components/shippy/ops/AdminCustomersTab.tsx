import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, Search, Users } from "lucide-react";
import { opsCustomers } from "@/lib/shippy-admin.functions";
import { formatStamp } from "@/lib/shippy-format";
import {
  AdminCard,
  AdminModal,
  EmptyState,
  LoadingBlock,
  StatusPill,
  adminBtnGhost,
  adminInput,
} from "./admin-ui";

type Customers = Awaited<ReturnType<typeof opsCustomers>>;
type Customer = Customers[number];

export function AdminCustomersTab({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [customers, setCustomers] = useState<Customers | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await opsCustomers({ data: { token } });
        if (!cancelled) setCustomers(data);
      } catch {
        onExpired();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onExpired]);

  if (!customers) return <LoadingBlock label="Loading customers…" />;

  const rows = customers.filter((customer) => {
    if (!query.trim()) return true;
    return [customer.name, customer.email, customer.phone, customer.roles.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
        <p className="mt-1 text-sm text-slate-500">
          Senders, recipients and tracking subscribers from every shipment.
        </p>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone or role"
              className={`${adminInput} pl-9`}
            />
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
            {rows.length} customer{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState
              title="No customers found"
              description="Customers appear automatically when a shipment is created."
            />
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Shipments</th>
                  <th className="pb-2">Last activity</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((customer) => (
                  <tr key={customer.id}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Users className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{customer.email || "—"}</td>
                    <td className="py-3 pr-3 text-slate-600">{customer.phone || "—"}</td>
                    <td className="py-3 pr-3 text-slate-600">{customer.roles.join(", ")}</td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">{customer.shipments}</td>
                    <td className="py-3 pr-3 text-slate-500">
                      {formatStamp(customer.lastActivity)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(customer)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Customer"}
        description="Contact details and every shipment linked to this customer."
        wide
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  {selected.email || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selected.phone || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Roles
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {selected.roles.join(", ")}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Shipments
              </h3>
              {selected.records.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  This customer is subscribed to updates but has no shipment yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {selected.records.map((record) => (
                    <li
                      key={record.trackingNumber}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {record.trackingNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record.route} · {formatStamp(record.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={record.status} />
                        <Link
                          to="/trackingresult"
                          search={{ number: record.trackingNumber }}
                          className={adminBtnGhost}
                        >
                          Track
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
