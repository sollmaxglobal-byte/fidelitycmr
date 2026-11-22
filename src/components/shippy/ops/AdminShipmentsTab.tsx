import { useCallback, useEffect, useState } from "react";
import { Eye, PackagePlus, Printer, RefreshCw, Search, Send } from "lucide-react";
import { SHIPMENT_STATUSES, type Shipment } from "@/data/shipments";
import { opsShipment } from "@/lib/shippy-admin.functions";
import { opsAddUpdate, opsOverview } from "@/lib/shippy.functions";
import { formatStamp } from "@/lib/shippy-format";
import {
  AdminCard,
  AdminField,
  AdminModal,
  AdminNotice,
  EmptyState,
  LoadingBlock,
  StatusPill,
  adminBtn,
  adminBtnGhost,
  adminInput,
} from "./admin-ui";

type Overview = Awaited<ReturnType<typeof opsOverview>>;
type ShipmentRow = Overview["shipments"][number];
type ShipmentDetail = Extract<Awaited<ReturnType<typeof opsShipment>>, { found: true }>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printShipment(shipment: Shipment) {
  const win = window.open("", "_blank", "width=820,height=680");
  if (!win) return;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;color:#64748b;font-size:12px;width:130px">${escapeHtml(
      label,
    )}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${escapeHtml(value)}</td></tr>`;
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(
    shipment.trackingNumber,
  )}</title><style>
    body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:28px;margin:0}
    .label{border:2px solid #0f172a;border-radius:14px;padding:22px;max-width:640px}
    h1{font-size:22px;margin:0 0 4px}
    .muted{color:#64748b;font-size:12px;margin:0 0 18px}
    .barcode{height:54px;margin:16px 0;background:repeating-linear-gradient(90deg,#0f172a 0 2px,#fff 2px 4px,#0f172a 4px 7px,#fff 7px 10px)}
    .grid{display:flex;gap:24px;border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px}
    .grid > div{flex:1}
    table{width:100%;border-collapse:collapse}
  </style></head><body onload="window.print()">
    <div class="label">
      <h1>Shippy Express</h1>
      <p class="muted">Shipping label · ${escapeHtml(shipment.mode)}</p>
      <div class="barcode"></div>
      <p style="font-size:18px;font-weight:700;letter-spacing:0.08em;margin:0 0 8px">${escapeHtml(
        shipment.trackingNumber,
      )}</p>
      <table>
        ${row("Status", shipment.status)}
        ${row("Route", `${shipment.origin.label} → ${shipment.destination.label}`)}
        ${row("Weight", `${shipment.weightKg} kg`)}
        ${row("Pieces", String(shipment.pieces))}
        ${row("Expected", formatStamp(shipment.expectedAt))}
      </table>
      <div class="grid">
        <div><strong>Sender</strong><br/>${escapeHtml(shipment.sender.name)}<br/>${escapeHtml(
          shipment.sender.phone,
        )}<br/>${escapeHtml(shipment.sender.address)}</div>
        <div><strong>Recipient</strong><br/>${escapeHtml(
          shipment.recipient.name,
        )}<br/>${escapeHtml(shipment.recipient.phone)}<br/>${escapeHtml(
          shipment.recipient.address,
        )}</div>
      </div>
    </div>
  </body></html>`);
  win.document.close();
}

export function AdminShipmentsTab({
  token,
  onExpired,
  onCreate,
}: {
  token: string;
  onExpired: () => void;
  onCreate: () => void;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [updateFor, setUpdateFor] = useState<ShipmentRow | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: "On The Way",
    location: "",
    comment: "",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await opsOverview({ data: { token } });
      setOverview(data);
    } catch {
      onExpired();
    }
  }, [token, onExpired]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!overview) return <LoadingBlock label="Loading shipments…" />;

  const rows = overview.shipments.filter((shipment) => {
    if (statusFilter !== "All Statuses" && shipment.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const haystack = [
      shipment.trackingNumber,
      shipment.senderName,
      shipment.senderPhone,
      shipment.recipientName,
      shipment.recipientEmail,
      shipment.recipientPhone,
      shipment.origin,
      shipment.destination,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const openDetail = async (shipment: ShipmentRow) => {
    try {
      const result = await opsShipment({ data: { token, number: shipment.trackingNumber } });
      if (result.found) setDetail(result);
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      else setError(message);
    }
  };

  const openUpdate = (shipment: ShipmentRow) => {
    setUpdateFor(shipment);
    setUpdateForm({ status: shipment.status, location: "", comment: "" });
    setNotice("");
    setError("");
  };

  const publishUpdate = async () => {
    if (!updateFor) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await opsAddUpdate({
        data: {
          token,
          number: updateFor.trackingNumber,
          status: updateForm.status,
          location: updateForm.location,
          comment: updateForm.comment,
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(
        `Update published for ${updateFor.trackingNumber}. ${result.notified} subscriber${
          result.notified === 1 ? "" : "s"
        } notified.`,
      );
      setUpdateFor(null);
      await refresh();
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async (shipment: ShipmentRow) => {
    try {
      const result = await opsShipment({ data: { token, number: shipment.trackingNumber } });
      if (result.found) printShipment(result.shipment);
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      else setError(message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage shipments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search consignments, publish tracking updates and print labels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} className={adminBtnGhost}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={onCreate} className={adminBtn}>
            <PackagePlus className="h-4 w-4" /> Create shipment
          </button>
        </div>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      <AdminCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracking number, sender, receiver or email"
              className={`${adminInput} pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${adminInput} max-w-[200px]`}
          >
            <option>All Statuses</option>
            {SHIPMENT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
            {rows.length} shipment{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState
              title="No shipments match this filter"
              description="Try a different status or search term."
            />
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Tracking #</th>
                  <th className="pb-2">Sender</th>
                  <th className="pb-2">Receiver</th>
                  <th className="pb-2">Origin → Destination</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((shipment) => (
                  <tr key={shipment.trackingNumber}>
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      {shipment.trackingNumber}
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        {shipment.mode}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      <span className="block font-medium text-slate-800">
                        {shipment.senderName}
                      </span>
                      <span className="text-xs">{shipment.senderPhone}</span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      <span className="block font-medium text-slate-800">
                        {shipment.recipientName}
                      </span>
                      <span className="text-xs">{shipment.recipientEmail}</span>
                      <span className="block text-xs">{shipment.recipientPhone}</span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusPill status={shipment.status} />
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{formatStamp(shipment.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(shipment)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openUpdate(shipment)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Send className="h-3.5 w-3.5" /> Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(shipment)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Printer className="h-3.5 w-3.5" /> Print
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
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Shipment ${detail.shipment.trackingNumber}` : "Shipment"}
        description="Consignment details and full tracking history."
        wide
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Route
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {detail.shipment.origin.label} → {detail.shipment.destination.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {detail.shipment.mode} · {detail.shipment.weightKg} kg · {detail.shipment.pieces}{" "}
                  piece{detail.shipment.pieces === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Expected {formatStamp(detail.shipment.expectedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-1">
                  <StatusPill status={detail.shipment.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {detail.subscribers} email subscriber{detail.subscribers === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-slate-600">
                  Updated {formatStamp(detail.shipment.updatedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sender
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {detail.shipment.sender.name}
                </p>
                <p className="text-sm text-slate-600">{detail.shipment.sender.phone}</p>
                <p className="text-sm text-slate-600">{detail.shipment.sender.address}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recipient
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {detail.shipment.recipient.name}
                </p>
                <p className="text-sm text-slate-600">{detail.shipment.recipient.phone}</p>
                <p className="text-sm text-slate-600">{detail.shipment.recipient.email}</p>
                <p className="text-sm text-slate-600">{detail.shipment.recipient.address}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tracking history
              </h3>
              <ol className="mt-3 space-y-3">
                {detail.shipment.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {event.status} · {event.location}
                      </p>
                      <p className="text-sm text-slate-600">{event.comment || "—"}</p>
                      <p className="text-xs text-slate-500">{formatStamp(event.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => printShipment(detail.shipment)}
                className={adminBtnGhost}
              >
                <Printer className="h-4 w-4" /> Print label
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetail(null);
                  const row = overview.shipments.find(
                    (item) => item.trackingNumber === detail.shipment.trackingNumber,
                  );
                  if (row) openUpdate(row);
                }}
                className={adminBtn}
              >
                <Send className="h-4 w-4" /> Publish update
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(updateFor)}
        onClose={() => setUpdateFor(null)}
        title={updateFor ? `Update ${updateFor.trackingNumber}` : "Update shipment"}
        description="Publishing an update emails every subscribed customer automatically."
      >
        <div className="space-y-4">
          <AdminField label="Status">
            <select
              value={updateForm.status}
              onChange={(event) => setUpdateForm({ ...updateForm, status: event.target.value })}
              className={adminInput}
            >
              {SHIPMENT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Location">
            <input
              value={updateForm.location}
              onChange={(event) => setUpdateForm({ ...updateForm, location: event.target.value })}
              placeholder="e.g. New York, USA"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Comment">
            <input
              value={updateForm.comment}
              onChange={(event) => setUpdateForm({ ...updateForm, comment: event.target.value })}
              placeholder="e.g. Out for final delivery"
              className={adminInput}
            />
          </AdminField>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setUpdateFor(null)} className={adminBtnGhost}>
              Cancel
            </button>
            <button type="button" onClick={publishUpdate} disabled={busy} className={adminBtn}>
              <Send className="h-4 w-4" /> {busy ? "Publishing…" : "Publish update"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
