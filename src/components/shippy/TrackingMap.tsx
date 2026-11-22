import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { Navigation } from "lucide-react";
import type { Place } from "@/data/shipments";
import { distanceKm } from "@/lib/geo";

export function TrackingMap({
  origin,
  current,
  destination,
}: {
  origin: Place;
  current: Place;
  destination: Place;
}) {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current) return;

      map = L.map(container.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const points: [number, number][] = [
        [origin.lat, origin.lng],
        [current.lat, current.lng],
        [destination.lat, destination.lng],
      ];

      L.polyline(points, { color: "#0f172a", weight: 8, opacity: 0.18 }).addTo(map);
      L.polyline(points, { color: "#facc15", weight: 3, dashArray: "10 12" }).addTo(map);

      const pin = (letter: string, background: string) =>
        L.divIcon({
          className: "shippy-map-pin",
          html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:${background};color:#fff;font:700 13px/1 Inter,system-ui,sans-serif;border:3px solid #fff;box-shadow:0 6px 16px rgba(15,23,42,.35)">${letter}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

      L.marker([origin.lat, origin.lng], { icon: pin("A", "#1d4ed8") })
        .addTo(map)
        .bindPopup(`<strong>Origin</strong><br/>${origin.label}`);

      L.marker([current.lat, current.lng], { icon: pin("B", "#f59e0b") })
        .addTo(map)
        .bindPopup(`<strong>Current location</strong><br/>${current.label}`);

      L.marker([destination.lat, destination.lng], { icon: pin("C", "#16a34a") })
        .addTo(map)
        .bindPopup(`<strong>Destination</strong><br/>${destination.label}`);

      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 5 });
      setTimeout(() => map?.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [
    origin.lat,
    origin.lng,
    origin.label,
    current.lat,
    current.lng,
    current.label,
    destination.lat,
    destination.lng,
    destination.label,
  ]);

  return (
    <div className="relative">
      <div ref={container} className="h-[380px] w-full rounded-xl border border-slate-200" />
      <div className="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow">
        <span className="shippy-live-dot" />
        Live tracking
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            A
          </span>
          <span className="truncate text-slate-700">Origin · {origin.city}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            B
          </span>
          <span className="truncate text-slate-700">Current · {current.city}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            C
          </span>
          <span className="truncate text-slate-700">Destination · {destination.city}</span>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <Navigation className="h-4 w-4 text-blue-600" />
        Estimated route distance: {distanceKm(origin, destination).toLocaleString()} km
      </p>
    </div>
  );
}
