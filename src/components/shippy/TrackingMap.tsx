import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minus, Navigation, Plus } from "lucide-react";
import type { Place } from "@/data/shipments";
import { distanceKm } from "@/lib/geo";

type Stop = { letter: "A" | "B" | "C"; role: string; place: Place; color: string };

/** Stops less than a kilometre apart share one marker so none is hidden. */
const sameSpot = (a: Place, b: Place) => distanceKm(a, b) < 1;

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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const fitRef = useRef<(() => void) | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current) return;

      map = L.map(container.current, {
        scrollWheelZoom: true,
        zoomControl: false,
        minZoom: 2,
        maxZoom: 19,
        worldCopyJump: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const stops: Stop[] = [
        { letter: "A", role: "Origin", place: origin, color: "#1d4ed8" },
        { letter: "B", role: "Current location", place: current, color: "#f59e0b" },
        { letter: "C", role: "Destination", place: destination, color: "#16a34a" },
      ];

      const groups: { place: Place; stops: Stop[] }[] = [];
      for (const stop of stops) {
        const group = groups.find((item) => sameSpot(item.place, stop.place));
        if (group) group.stops.push(stop);
        else groups.push({ place: stop.place, stops: [stop] });
      }

      const route = [origin, current, destination].filter(
        (place, index, all) => index === 0 || !sameSpot(all[index - 1], place),
      );
      const routePoints = route.map((place) => [place.lat, place.lng] as [number, number]);

      if (routePoints.length > 1) {
        L.polyline(routePoints, { color: "#0f172a", weight: 8, opacity: 0.18 }).addTo(map);
        L.polyline(routePoints, { color: "#facc15", weight: 3, dashArray: "10 12" }).addTo(map);
      }

      const pin = (letters: string, background: string) =>
        L.divIcon({
          className: "shippy-map-pin",
          html: `<span style="display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;padding:0 6px;border-radius:999px;background:${background};color:#fff;font:700 12px/1 Inter,system-ui,sans-serif;border:3px solid #fff;box-shadow:0 6px 16px rgba(15,23,42,.35)">${letters}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

      for (const group of groups) {
        const letters = group.stops.map((stop) => stop.letter).join("/");
        const color = group.stops.some((stop) => stop.letter === "C")
          ? "#16a34a"
          : group.stops.some((stop) => stop.letter === "B")
            ? "#f59e0b"
            : "#1d4ed8";
        const popup = group.stops
          .map(
            (stop) =>
              `<strong>${stop.role}</strong><br/>${stop.place.label}<br/><span style="opacity:.65">${stop.place.lat.toFixed(4)}, ${stop.place.lng.toFixed(4)}</span>`,
          )
          .join('<div style="height:8px"></div>');

        L.marker([group.place.lat, group.place.lng], {
          icon: pin(letters, color),
          title: group.place.label,
        })
          .addTo(map)
          .bindPopup(popup);
      }

      const fit = () => {
        if (!map) return;
        const points = groups.map(
          (group) => [group.place.lat, group.place.lng] as [number, number],
        );
        if (points.length === 1) {
          map.setView(points[0], 12);
        } else {
          map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 12 });
        }
      };
      fitRef.current = fit;
      fit();

      const syncZoom = () => setZoom(map?.getZoom() ?? null);
      syncZoom();
      map.on("zoomend", syncZoom);
      setTimeout(() => map?.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      fitRef.current = null;
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

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setZoom(map.getZoom() + delta);
  };

  return (
    <div className="relative">
      <div ref={container} className="h-[380px] w-full rounded-xl border border-slate-200" />

      <div className="pointer-events-none absolute left-3 top-3 z-[1100] flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow">
        <span className="shippy-live-dot" />
        Live tracking
      </div>

      <div className="absolute right-3 top-3 z-[1100] flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-md ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            data-map-zoom
            className="min-w-14 text-center text-xs font-semibold tabular-nums text-slate-700"
          >
            Zoom {zoom ?? "—"}
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => fitRef.current?.()}
          aria-label="Fit full route"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md ring-1 ring-slate-200 transition-colors hover:bg-white"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Fit route
        </button>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            A
          </span>
          <span className="leading-snug text-slate-700">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Origin
            </span>
            {origin.label}
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            B
          </span>
          <span className="leading-snug text-slate-700">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Current location
            </span>
            {current.label}
            {sameSpot(current, destination) && (
              <span className="block text-xs font-medium text-emerald-600">Arrived</span>
            )}
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            C
          </span>
          <span className="leading-snug text-slate-700">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Destination
            </span>
            {destination.label}
          </span>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <Navigation className="h-4 w-4 text-blue-600" />
        Estimated route distance: {distanceKm(origin, destination).toLocaleString()} km
      </p>
    </div>
  );
}
