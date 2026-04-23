import { Crosshair, MapPin, Navigation } from "lucide-react";
import type { Coordinates } from "@/hooks/use-geolocation";
import type { Hotspot } from "@/types/api";

type Marker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  tone: "hotspot" | "user";
};

export function HotspotMapPreview({ hotspots, userLocation, radiusKm }: { hotspots: Hotspot[]; userLocation: Coordinates | null; radiusKm: number }) {
  const markers: Marker[] = [
    ...hotspots.map((hotspot) => ({
      id: hotspot.id,
      title: hotspot.title,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      tone: "hotspot" as const
    })),
    ...(userLocation
      ? [
          {
            id: "user-location",
            title: "Your location",
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            tone: "user" as const
          }
        ]
      : [])
  ];

  const bounds = getBounds(markers);

  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-lg border border-ink/10 bg-[#dbe8e1] shadow-soft">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,32,31,0.08)_1px,transparent_1px),linear-gradient(rgba(24,32,31,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute left-[8%] top-[16%] h-28 w-40 rounded-full border border-fern/20 bg-fern/10" />
      <div className="absolute bottom-[18%] right-[10%] h-36 w-52 rounded-full border border-coral/20 bg-coral/10" />

      {userLocation ? (
        <div className="absolute left-4 top-4 rounded-md border border-ink/10 bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-soft">
          Radius {radiusKm} km
        </div>
      ) : null}

      {markers.map((marker) => {
        const position = projectMarker(marker, bounds);
        const isUser = marker.tone === "user";

        return (
          <div
            key={marker.id}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-soft ${isUser ? "bg-ink text-white" : "bg-white text-ink"}`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-md ${isUser ? "bg-signal text-ink" : "bg-fern text-white"}`}>
              {isUser ? <Crosshair aria-hidden="true" size={17} /> : <MapPin aria-hidden="true" size={17} />}
            </span>
            <span className="hidden max-w-28 truncate sm:inline">{marker.title}</span>
          </div>
        );
      })}

      <div className="absolute bottom-4 left-4 right-4 rounded-md bg-white/90 p-4 text-sm text-ink shadow-soft backdrop-blur">
        <div className="flex items-center gap-2 font-bold">
          <Navigation aria-hidden="true" size={17} />
          Discovery map
        </div>
        <div className="mt-1 text-ink/65">
          {userLocation ? "Hotspots are projected from coordinates and filtered by your selected radius." : "Enable location to calculate real distance and nearby coverage."}
        </div>
      </div>
    </section>
  );
}

function getBounds(markers: Marker[]) {
  const latitudes = markers.map((marker) => marker.latitude);
  const longitudes = markers.map((marker) => marker.longitude);
  const fallback = {
    minLat: 39.88,
    maxLat: 39.95,
    minLng: 32.8,
    maxLng: 32.9
  };

  if (markers.length === 0) {
    return fallback;
  }

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.01);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.01);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding
  };
}

function projectMarker(marker: Marker, bounds: ReturnType<typeof getBounds>) {
  const lngSpan = bounds.maxLng - bounds.minLng || 1;
  const latSpan = bounds.maxLat - bounds.minLat || 1;
  const x = ((marker.longitude - bounds.minLng) / lngSpan) * 84 + 8;
  const y = (1 - (marker.latitude - bounds.minLat) / latSpan) * 76 + 12;

  return {
    x: clamp(x, 8, 92),
    y: clamp(y, 12, 88)
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
