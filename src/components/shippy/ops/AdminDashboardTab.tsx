import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  PackageCheck,
  PackagePlus,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { opsDeposits } from "@/lib/shippy-admin.functions";
import { opsOverview } from "@/lib/shippy.functions";
import { formatMoney, formatStamp } from "@/lib/shippy-format";
import {
  AdminCard,
  AdminStat,
  LoadingBlock,
  StatusPill,
  adminBtn,
  adminBtnGhost,
} from "./admin-ui";
import type { AdminTab } from "./AdminShell";

type Overview = Awaited<ReturnType<typeof opsOverview>>;
type Deposits = Awaited<ReturnType<typeof opsDeposits>>;

export function AdminDashboardTab({
  token,
  onExpired,
  onNavigate,
}: {
  token: string;
  onExpired: () => void;
  onNavigate: (tab: AdminTab) => void;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [deposits, setDeposits] = useState<Deposits | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [nextOverview, nextDeposits] = await Promise.all([
          opsOverview({ data: { token } }),
          opsDeposits({ data: { token } }),
        ]);
        if (!cancelled) {
          setOverview(nextOverview);
          setDeposits(nextDeposits);
        }
      } catch {
        onExpired();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onExpired]);

  if (!overview || !deposits) return <LoadingBlock label="Loading dashboard…" />;

  const stats = overview.stats;
  const pendingDeposits = deposits.filter((deposit) => deposit.status === "Pending");
  const statusCounts = overview.shipments.reduce<Record<string, number>>((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] ?? 0) + 1;
    return acc;
  }, {});
  const maxStatus = Math.max(1, ...Object.values(statusCounts));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Welcome back</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Shippy Express operations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track shipments, deposits, customers and the settings that power the site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate("new-shipment")} className={adminBtn}>
            <PackagePlus className="h-4 w-4" /> Create shipment
          </button>
          <button type="button" onClick={() => onNavigate("shipments")} className={adminBtnGhost}>
            <Package className="h-4 w-4" /> Manage shipments
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat label="Total shipments" value={stats.totalShipments} icon={Package} />
        <AdminStat label="In transit" value={stats.inTransit} icon={Truck} tone="amber" />
        <AdminStat label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="emerald" />
        <AdminStat label="Customers" value={stats.customers} icon={Users} tone="violet" />
        <AdminStat
          label="Pending deposits"
          value={stats.pendingDeposits}
          hint={`$${formatMoney(stats.pendingDepositAmount)} awaiting review`}
          icon={Wallet}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard
          className="lg:col-span-2"
          title="Latest shipments"
          description="The most recent consignments registered in the console."
          actions={
            <button type="button" onClick={() => onNavigate("shipments")} className={adminBtnGhost}>
              View all <ArrowRight className="h-4 w-4" />
            </button>
          }
        >
          {overview.shipments.length === 0 ? (
            <p className="text-sm text-slate-500">No shipments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2">Tracking</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.shipments.slice(0, 6).map((shipment) => (
                    <tr key={shipment.trackingNumber}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">
                        {shipment.trackingNumber}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        <span className="block font-medium text-slate-800">
                          {shipment.recipientName}
                        </span>
                        <span className="text-xs text-slate-500">{shipment.recipientEmail}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {shipment.origin} → {shipment.destination}
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={shipment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Shipment statistics" description="Current consignments by status.">
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{status}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max(8, (count / maxStatus) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-sm text-slate-500">No shipment data yet.</p>
            )}
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard
          className="lg:col-span-2"
          title="Recent deposits"
          description="Latest shipment deposits waiting for review."
          actions={
            <button type="button" onClick={() => onNavigate("deposits")} className={adminBtnGhost}>
              Open deposits <ArrowRight className="h-4 w-4" />
            </button>
          }
        >
          {pendingDeposits.length === 0 ? (
            <p className="text-sm text-slate-500">No pending deposits. All caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingDeposits.slice(0, 5).map((deposit) => (
                <li
                  key={deposit.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{deposit.clientName}</p>
                    <p className="text-xs text-slate-500">
                      {deposit.clientEmail} · {deposit.method} · {formatStamp(deposit.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">
                      ${formatMoney(deposit.amount)}
                    </span>
                    <StatusPill status={deposit.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Quick actions" description="Jump straight to a common task.">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("new-shipment")}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <PackagePlus className="h-4 w-4 text-blue-600" /> Create a new shipment
            </button>
            <button
              type="button"
              onClick={() => onNavigate("customers")}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Users className="h-4 w-4 text-blue-600" /> Browse customers
            </button>
            <button
              type="button"
              onClick={() => onNavigate("emails")}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <PackageCheck className="h-4 w-4 text-blue-600" /> Send an email update
            </button>
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Wallet className="h-4 w-4 text-blue-600" /> Review app settings
            </button>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
