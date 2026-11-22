import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, PackagePlus } from "lucide-react";
import { SHIPMENT_STATUSES, SHIPPY_HUBS } from "@/data/shipments";
import { opsCreateShipment } from "@/lib/shippy.functions";

const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

const MODES = ["Air Freight", "Sea Freight", "Road Freight"];

const initialForm = {
  number: "",
  status: "Order Confirmed",
  mode: "Air Freight",
  originLabel: SHIPPY_HUBS[0].label,
  destinationLabel: SHIPPY_HUBS[1].label,
  weightKg: "1",
  pieces: "1",
  dimensions: "",
  expectedAt: "",
  senderName: "",
  senderPhone: "",
  recipientName: "",
  recipientPhone: "",
  recipientEmail: "",
  comment: "",
};

export function OpsNewShipmentTab({
  token,
  onExpired,
}: {
  token: string;
  onExpired: () => void;
}) {
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <PackagePlus className="h-5 w-5 text-blue-600" /> Add tracking
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Register a new shipment so its tracking number works on the public tracking page.
      </p>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setNotice("");
          setError("");
          setCreated(null);
          try {
            const result = await opsCreateShipment({
              data: {
                token,
                number: form.number,
                status: form.status,
                mode: form.mode,
                originLabel: form.originLabel,
                destinationLabel: form.destinationLabel,
                weightKg: Number(form.weightKg),
                pieces: Number(form.pieces),
                dimensions: form.dimensions,
                expectedAt: form.expectedAt,
                senderName: form.senderName,
                senderPhone: form.senderPhone,
                recipientName: form.recipientName,
                recipientPhone: form.recipientPhone,
                recipientEmail: form.recipientEmail,
                comment: form.comment,
              },
            });
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setCreated(result.shipment.trackingNumber);
            setNotice(`Tracking ${result.shipment.trackingNumber} is now live.`);
            setForm({ ...initialForm, status: form.status, mode: form.mode });
          } catch (err) {
            const message = (err as Error).message;
            if (/unauthor/i.test(message)) onExpired();
            setError(message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm text-slate-600">
          Tracking number
          <input
            required
            value={form.number}
            onChange={(event) => set("number", event.target.value)}
            placeholder="e.g. REM-91076437"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Status
          <select
            value={form.status}
            onChange={(event) => set("status", event.target.value)}
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
          Origin hub
          <select
            value={form.originLabel}
            onChange={(event) => set("originLabel", event.target.value)}
            className={`${field} mt-1`}
          >
            {SHIPPY_HUBS.map((hub) => (
              <option key={hub.label} value={hub.label}>
                {hub.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Destination hub
          <select
            value={form.destinationLabel}
            onChange={(event) => set("destinationLabel", event.target.value)}
            className={`${field} mt-1`}
          >
            {SHIPPY_HUBS.map((hub) => (
              <option key={hub.label} value={hub.label}>
                {hub.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Delivery mode
          <select
            value={form.mode}
            onChange={(event) => set("mode", event.target.value)}
            className={`${field} mt-1`}
          >
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Expected delivery
          <input
            type="date"
            value={form.expectedAt}
            onChange={(event) => set("expectedAt", event.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Weight (kg)
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.weightKg}
            onChange={(event) => set("weightKg", event.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Pieces
          <input
            type="number"
            min="1"
            value={form.pieces}
            onChange={(event) => set("pieces", event.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Sender name
          <input
            value={form.senderName}
            onChange={(event) => set("senderName", event.target.value)}
            placeholder="e.g. Adaeze Okafor"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Sender phone
          <input
            value={form.senderPhone}
            onChange={(event) => set("senderPhone", event.target.value)}
            placeholder="e.g. +234 802 555 0114"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Recipient name
          <input
            value={form.recipientName}
            onChange={(event) => set("recipientName", event.target.value)}
            placeholder="e.g. James Whitfield"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Recipient phone
          <input
            value={form.recipientPhone}
            onChange={(event) => set("recipientPhone", event.target.value)}
            placeholder="e.g. +44 7700 900123"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Recipient email
          <input
            type="email"
            value={form.recipientEmail}
            onChange={(event) => set("recipientEmail", event.target.value)}
            placeholder="buyer@example.com"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Dimensions
          <input
            value={form.dimensions}
            onChange={(event) => set("dimensions", event.target.value)}
            placeholder="e.g. 60 × 40 × 40 cm"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          First update note
          <input
            value={form.comment}
            onChange={(event) => set("comment", event.target.value)}
            placeholder="e.g. Shipment registered and awaiting pickup"
            className={`${field} mt-1`}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Add shipment
          </button>
        </div>
        {notice && (
          <p className="text-sm text-emerald-700 sm:col-span-2">
            {notice}{" "}
            {created && (
              <Link
                to="/trackingresult"
                search={{ number: created }}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Open tracking page
              </Link>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>
    </div>
  );
}
