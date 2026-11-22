import { ClipboardCheck, Home, PackageCheck, ShieldAlert, Truck } from "lucide-react";
import { SHIPMENT_STATUSES, type ShipmentStatus, type TrackingEvent } from "@/data/shipments";
import { formatDate } from "@/lib/shippy-format";

const icons: Record<ShipmentStatus, typeof Truck> = {
  "Order Confirmed": ClipboardCheck,
  "Picked by Courier": PackageCheck,
  "On The Way": Truck,
  "Custom Hold": ShieldAlert,
  Delivered: Home,
};

export function ShipmentProgress({
  status,
  events,
}: {
  status: ShipmentStatus;
  events: TrackingEvent[];
}) {
  const activeIndex = Math.max(0, SHIPMENT_STATUSES.indexOf(status));
  const percent = (activeIndex / (SHIPMENT_STATUSES.length - 1)) * 100;

  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-slate-200" />
      <div
        className="absolute left-0 top-5 h-1 rounded-full bg-blue-600 transition-all duration-700"
        style={{ width: `${percent}%` }}
      />
      <div className="relative grid grid-cols-5 gap-2">
        {SHIPMENT_STATUSES.map((step, index) => {
          const Icon = icons[step];
          const done = index <= activeIndex;
          const event = events.find((e) => e.status === step);
          return (
            <div key={step} className="flex flex-col items-center text-center">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                  done ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`mt-2 text-xs font-semibold sm:text-sm ${done ? "text-slate-900" : "text-slate-500"}`}
              >
                {step}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-500">
                {event ? formatDate(event.at) : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-slate-500">Shipment progress</span>
        <span className="font-semibold text-blue-700">
          {Math.round(((activeIndex + 1) / SHIPMENT_STATUSES.length) * 100)}% complete
        </span>
      </div>
    </div>
  );
}
