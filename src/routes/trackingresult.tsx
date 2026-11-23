import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Printer,
  User,
} from "lucide-react";
import type { Shipment } from "@/data/shipments";
import { getShipment } from "@/lib/shippy.functions";
import { formatDate, formatMoney, formatStamp } from "@/lib/shippy-format";
import { ShippyLayout } from "@/components/shippy/ShippyLayout";
import { TrackForm } from "@/components/shippy/TrackForm";
import { TrackingMap } from "@/components/shippy/TrackingMap";
import { ShipmentProgress } from "@/components/shippy/ShipmentProgress";
import { EmailUpdates } from "@/components/shippy/EmailUpdates";

export const Route = createFileRoute("/trackingresult")({
  validateSearch: (search: Record<string, unknown>) => ({
    number: typeof search.number === "string" ? search.number : "",
  }),
  head: () => ({
    meta: [
      { title: "Shipment Tracking — Navora Logistics" },
      {
        name: "description",
        content:
          "Follow your Navora Logistics shipment in real time with live map tracking and history.",
      },
    ],
  }),
  component: TrackingResultPage,
});

const statusStyles: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  "On The Way": "bg-blue-100 text-blue-700",
  "Order Confirmed": "bg-slate-100 text-slate-700",
  "Picked by Courier": "bg-indigo-100 text-indigo-700",
  "Custom Hold": "bg-amber-100 text-amber-700",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function TrackingResultPage() {
  const { number } = Route.useSearch();
  const [state, setState] = useState<{
    loading: boolean;
    shipment?: Shipment;
    subscribers?: number;
    error?: string;
  }>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    if (!number) {
      setState({ loading: false, error: "Enter a tracking number to see its status." });
      return;
    }
    getShipment({ data: { number } })
      .then((result) => {
        if (cancelled) return;
        if (!result.found) {
          setState({ loading: false, error: "No shipment found for this tracking number." });
          return;
        }
        setState({
          loading: false,
          shipment: result.shipment as Shipment,
          subscribers: result.subscribers,
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ loading: false, error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  const shipment = state.shipment;

  return (
    <ShippyLayout>
      <section className="relative overflow-hidden bg-slate-900">
        <img
          src="/shippy/tracking.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-slate-900/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white md:text-4xl">Shipment Tracking</h1>
          <nav className="mt-4 flex items-center gap-2 text-sm text-slate-300">
            <Link to="/" className="hover:text-blue-300">
              Home
            </Link>
            <span className="text-slate-500">/</span>
            <span>Tracking</span>
            <span className="text-slate-500">/</span>
            <Link to="/track-order" className="inline-flex items-center gap-1 hover:text-blue-300">
              <ArrowLeft className="h-3 w-3" /> Back to Track
            </Link>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {state.loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Fetching result for tracking number {number}…
          </div>
        )}

        {!state.loading && !shipment && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Box className="mx-auto h-10 w-10 text-blue-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{state.error}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Check the number on your shipping confirmation email and try again, or use the demo
              number below.
            </p>
            <div className="mt-6">
              <TrackForm variant="page" defaultValue="REM-91076436" />
            </div>
          </div>
        )}

        {shipment && (
          <div className="shipment-print space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Tracking Number</p>
                    <p className="mt-1 text-2xl font-bold tracking-wide text-slate-900">
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" /> Verified
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Last updated:{" "}
                    <strong className="text-slate-900">{formatStamp(shipment.updatedAt)}</strong>
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {shipment.current.label}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Current Status</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    statusStyles[shipment.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {shipment.status}
                </span>
                <div className="mt-4 space-y-1">
                  <InfoRow label="Delivery Mode" value={shipment.mode} />
                  <InfoRow label="Expected" value={formatDate(shipment.expectedAt)} />
                  <InfoRow label="Duty Fees" value={shipment.dutyPaid ? "Paid" : "Outstanding"} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <User className="h-5 w-5 text-blue-600" /> Sender Information
                </h2>
                <div className="mt-3 space-y-1">
                  <InfoRow label="Name" value={shipment.sender.name} />
                  <InfoRow label="Address" value={shipment.sender.address} />
                  <InfoRow label="Phone" value={shipment.sender.phone} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <User className="h-5 w-5 text-blue-600" /> Receiver Information
                </h2>
                <div className="mt-3 space-y-1">
                  <InfoRow label="Name" value={shipment.recipient.name} />
                  <InfoRow label="Address" value={shipment.recipient.address} />
                  <InfoRow label="Phone" value={shipment.recipient.phone} />
                  {shipment.recipient.email && (
                    <InfoRow label="Email" value={shipment.recipient.email} />
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Shipment Progress</h2>
              <div className="mt-6">
                <ShipmentProgress status={shipment.status} events={shipment.events} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Shipment History</h2>
                <ol className="mt-5 space-y-5">
                  {shipment.events.map((event, index) => (
                    <li key={event.id} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        {index < shipment.events.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-slate-200" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-xs text-slate-500">{formatStamp(event.at)}</p>
                        <p className="mt-1 font-semibold text-slate-900">{event.status}</p>
                        <p className="text-sm text-slate-600">
                          {event.location}
                          {event.comment ? ` — ${event.comment}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Parcel Information</h2>
                  <div className="mt-3 space-y-1">
                    <InfoRow label="Weight" value={`${shipment.weightKg} kg`} />
                    <InfoRow label="Pieces" value={String(shipment.pieces)} />
                    <InfoRow label="Dimensions" value={shipment.dimensions} />
                    <InfoRow label="Pickup Date" value={formatStamp(shipment.pickupAt)} />
                    <InfoRow label="Expected Delivery" value={formatStamp(shipment.expectedAt)} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <CreditCard className="h-5 w-5 text-blue-600" /> Duty Fees
                  </h2>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Customs clearance fee</span>
                    <span className="text-lg font-bold text-slate-900">
                      ${formatMoney(shipment.dutyFee)}
                    </span>
                  </div>
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      shipment.dutyPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {shipment.dutyPaid ? "Paid" : "Payment required"}
                  </span>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Printer className="h-4 w-4" /> Print Receipt
                    </button>
                    {!shipment.dutyPaid && (
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4" /> Pay Clearance Fee
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Complete Shipment Route</h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Live map view
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Origin A → Current B → Destination C, updated {formatStamp(shipment.updatedAt)}
              </p>
              <div className="mt-5">
                <TrackingMap
                  origin={shipment.origin}
                  current={shipment.current}
                  destination={shipment.destination}
                />
              </div>
            </div>

            <EmailUpdates trackingNumber={shipment.trackingNumber} />
          </div>
        )}
      </div>
    </ShippyLayout>
  );
}
