import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Trash2, Wallet } from "lucide-react";
import type { Deposit } from "@/data/deposits";
import { opsDeleteDeposit, opsDeposits, opsUpdateDeposit } from "@/lib/shippy-admin.functions";
import { formatMoney, formatStamp } from "@/lib/shippy-format";
import {
  AdminCard,
  AdminModal,
  AdminNotice,
  AdminStat,
  EmptyState,
  LoadingBlock,
  StatusPill,
  adminBtn,
  adminBtnDanger,
  adminBtnGhost,
  adminInput,
} from "./admin-ui";

type Deposits = Awaited<ReturnType<typeof opsDeposits>>;

export function AdminDepositsTab({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [deposits, setDeposits] = useState<Deposits | null>(null);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [processTarget, setProcessTarget] = useState<Deposit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deposit | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await opsDeposits({ data: { token } });
      setDeposits(data);
    } catch {
      onExpired();
    }
  }, [token, onExpired]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!deposits) return <LoadingBlock label="Loading deposits…" />;

  const rows = deposits.filter(
    (deposit) => statusFilter === "All Statuses" || deposit.status === statusFilter,
  );
  const pending = deposits.filter((deposit) => deposit.status === "Pending");
  const completed = deposits.filter((deposit) => deposit.status === "Completed");

  const processDeposit = async () => {
    if (!processTarget) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsUpdateDeposit({
        data: { token, id: processTarget.id, status: "Completed" },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(`Deposit from ${processTarget.clientName} marked as completed.`);
      setProcessTarget(null);
      await refresh();
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const removeDeposit = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsDeleteDeposit({ data: { token, id: deleteTarget.id } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice("Deposit deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Shipment deposits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review client deposits, process them or remove invalid entries.
        </p>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat
          label="Pending"
          value={pending.length}
          hint={`$${formatMoney(pending.reduce((sum, deposit) => sum + deposit.amount, 0))} waiting`}
          icon={Wallet}
          tone="amber"
        />
        <AdminStat
          label="Completed"
          value={completed.length}
          hint={`$${formatMoney(completed.reduce((sum, deposit) => sum + deposit.amount, 0))} processed`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <AdminStat
          label="All deposits"
          value={deposits.length}
          hint={`$${formatMoney(deposits.reduce((sum, deposit) => sum + deposit.amount, 0))} total`}
          icon={Wallet}
          tone="blue"
        />
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${adminInput} max-w-[200px]`}
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Rejected</option>
          </select>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
            {rows.length} deposit{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState title="No deposits match this filter" />
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Client name</th>
                  <th className="pb-2">Client email</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Payment method</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date created</th>
                  <th className="pb-2 text-right">Option</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="py-3 pr-3 font-semibold text-slate-900">{deposit.clientName}</td>
                    <td className="py-3 pr-3 text-slate-600">{deposit.clientEmail}</td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      ${formatMoney(deposit.amount)}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{deposit.method}</td>
                    <td className="py-3 pr-3">
                      <StatusPill status={deposit.status} />
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{formatStamp(deposit.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        {deposit.status === "Pending" && (
                          <button
                            type="button"
                            onClick={() => setProcessTarget(deposit)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Process
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(deposit)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      <AdminModal
        open={Boolean(processTarget)}
        onClose={() => setProcessTarget(null)}
        title="Process deposit"
        description="Mark this client deposit as completed."
      >
        {processTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{processTarget.clientName}</p>
              <p className="text-slate-600">{processTarget.clientEmail}</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                ${formatMoney(processTarget.amount)}{" "}
                <span className="text-sm font-medium text-slate-500">
                  via {processTarget.method}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProcessTarget(null)}
                className={adminBtnGhost}
              >
                Cancel
              </button>
              <button type="button" onClick={processDeposit} disabled={busy} className={adminBtn}>
                <CheckCircle2 className="h-4 w-4" /> {busy ? "Processing…" : "Mark completed"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete deposit"
        description="This removes the deposit record from the console."
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete the ${formatMoney(deleteTarget.amount)} {deleteTarget.method} deposit from{" "}
              <span className="font-semibold text-slate-900">{deleteTarget.clientName}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className={adminBtnGhost}>
                Cancel
              </button>
              <button
                type="button"
                onClick={removeDeposit}
                disabled={busy}
                className={adminBtnDanger}
              >
                <Trash2 className="h-4 w-4" /> {busy ? "Deleting…" : "Delete deposit"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
