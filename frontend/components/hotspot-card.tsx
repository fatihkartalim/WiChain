import Link from "next/link";
import { Activity, Gauge, MapPin, Star, Wifi } from "lucide-react";
import type { Hotspot } from "@/types/api";

export function HotspotCard({ hotspot }: { hotspot: Hotspot }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-fern">
            <Wifi aria-hidden="true" size={16} />
            {hotspot.isOnline ? "Online" : "Offline"}
          </div>
          <h2 className="mt-2 text-xl font-bold text-ink">{hotspot.title}</h2>
        </div>
        <div className="rounded-md bg-signal px-3 py-2 text-right text-sm font-bold text-ink">
          {hotspot.pricePerHour.toFixed(2)} USD
          <div className="text-xs font-medium">per hour</div>
        </div>
      </div>

      <p className="mt-3 min-h-12 text-sm leading-6 text-ink/70">{hotspot.description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric icon={<Gauge size={16} />} label="Download" value={`${hotspot.downloadSpeed} Mbps`} />
        <Metric icon={<Activity size={16} />} label="Upload" value={`${hotspot.uploadSpeed} Mbps`} />
        <Metric icon={<Star size={16} />} label="Rating" value={`${hotspot.rating} (${hotspot.reviewCount})`} />
        <Metric icon={<MapPin size={16} />} label="Distance" value={`${hotspot.distanceKm ?? 0} km`} />
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:items-center">
        <div className="text-sm text-ink/70">
          <span className="font-semibold text-ink">{hotspot.city}</span>
          <div>{hotspot.address}</div>
        </div>
        <Link href={`/hotspots/${hotspot.id}`} className="grid min-h-10 place-items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-fern sm:min-w-20">
          View
        </Link>
      </div>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-mist p-3">
      <div className="flex items-center gap-2 text-ink/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  );
}
