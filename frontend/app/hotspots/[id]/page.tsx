"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, MapPin, Router, ShoppingCart, Star, Users, Wifi } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ProtectedPanel } from "@/components/protected-panel";
import { WalletButton } from "@/components/wallet-button";
import { queryKeys } from "@/lib/query-keys";
import { getHotspotById } from "@/services/hotspot.service";
import { getPackagesByHotspot } from "@/services/package.service";
import { getRatings } from "@/services/rating.service";
import type { Package } from "@/types/api";

export default function HotspotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard allowedRoles={["USER", "NODE_OWNER", "ADMIN"]}>
      <HotspotDetailContent id={id} />
    </AuthGuard>
  );
}

function HotspotDetailContent({ id }: { id: string }) {
  const hotspot = useQuery({
    queryKey: queryKeys.hotspotDetail(id),
    queryFn: () => getHotspotById(id)
  });

  const packages = useQuery({
    queryKey: queryKeys.packages(id),
    queryFn: () => getPackagesByHotspot(id)
  });

  const ratings = useQuery({
    queryKey: queryKeys.ratings(id),
    queryFn: () => getRatings(id)
  });

  if (hotspot.isLoading) {
    return (
      <ProtectedPanel title="Hotspot" subtitle="Loading hotspot details.">
        <StateBox title="Loading hotspot" body="Fetching hotspot, owner, and access package data." />
      </ProtectedPanel>
    );
  }

  if (hotspot.isError || !hotspot.data) {
    return (
      <ProtectedPanel title="Hotspot" subtitle="Resource not found.">
        <StateBox title="Resource not found" body="The hotspot detail could not be loaded." />
      </ProtectedPanel>
    );
  }

  const item = hotspot.data;
  const isPurchasable = item.status === "ACTIVE" && item.isOnline;

  return (
    <ProtectedPanel title={item.title} subtitle={`${item.address}, ${item.city}`}>
      <div className="mb-4 flex justify-end">
        <WalletButton />
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-fern">
                  <Wifi aria-hidden="true" size={17} />
                  {item.isOnline ? "Online" : "Offline"} / {item.status}
                </div>
                <h2 className="mt-3 text-2xl font-black text-ink">{item.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">{item.description}</p>
              </div>
              <div className="h-fit rounded-md bg-signal px-4 py-3 text-right font-black text-ink">
                {item.pricePerHour.toFixed(2)} USD
                <div className="text-xs font-semibold">reference hourly price</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={<Gauge size={17} />} label="Download" value={`${item.downloadSpeed} Mbps`} />
              <Metric icon={<Activity size={17} />} label="Upload" value={`${item.uploadSpeed} Mbps`} />
              <Metric icon={<Star size={17} />} label="Rating" value={`${item.rating} (${item.reviewCount})`} />
              <Metric icon={<MapPin size={17} />} label="Location" value={`${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`} />
            </div>
          </article>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-ink">Access Packages</h2>
                <p className="mt-2 text-sm text-ink/65">Choose a package to continue into checkout.</p>
              </div>
              <ShoppingCart aria-hidden="true" className="text-fern" size={24} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {packages.isLoading ? <StateBox title="Loading packages" body="Fetching active packages." /> : null}
              {packages.isError ? <StateBox title="Something went wrong" body="Packages could not be loaded." /> : null}
              {!packages.isLoading && !packages.isError && packages.data?.length === 0 ? <StateBox title="No packages" body="This hotspot has no active packages yet." /> : null}
              {packages.data?.map((accessPackage) => (
                <PackageCard key={accessPackage.id} accessPackage={accessPackage} disabled={!isPurchasable || !accessPackage.isActive} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-ink">Recent Ratings</h2>
                <p className="mt-2 text-sm text-ink/65">Feedback from completed access sessions.</p>
              </div>
              <Star aria-hidden="true" className="text-signal" size={24} />
            </div>

            <div className="mt-5 grid gap-3">
              {ratings.isLoading ? <StateBox title="Loading ratings" body="Fetching hotspot feedback." /> : null}
              {ratings.isError ? <StateBox title="Something went wrong" body="Ratings could not be loaded." /> : null}
              {!ratings.isLoading && !ratings.isError && ratings.data?.items.length === 0 ? <StateBox title="No ratings" body="Completed session ratings will appear here." /> : null}
              {ratings.data?.items.map((rating) => (
                <article key={rating.id} className="rounded-md border border-ink/10 bg-mist p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-1 text-signal" aria-label={`${rating.score} stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={16} fill={index < rating.score ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-ink/55">{new Date(rating.createdAt).toLocaleDateString()}</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/70">{rating.comment || "No comment provided."}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid gap-5 lg:self-start">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Owner</h2>
            <div className="mt-4 flex items-center gap-3 rounded-md bg-mist p-4">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-fern text-white">
                <Users aria-hidden="true" size={19} />
              </div>
              <div>
                <div className="font-bold text-ink">{item.owner.name}</div>
                <div className="text-sm text-ink/60">{item.owner.id.slice(0, 8)}</div>
              </div>
            </div>
          </section>

          <section className="min-h-64 rounded-lg border border-ink/10 bg-[#dbe8e1] p-5 shadow-soft">
            <div className="flex items-center gap-2 font-bold text-ink">
              <Router aria-hidden="true" size={18} />
              Coverage Preview
            </div>
            <div className="mt-5 grid h-44 place-items-center rounded-md border border-ink/10 bg-white/70 text-center text-sm font-semibold text-ink/65">
              {item.city}
              <br />
              {item.address}
            </div>
          </section>
        </aside>
      </section>
    </ProtectedPanel>
  );
}

function PackageCard({ accessPackage, disabled }: { accessPackage: Package; disabled: boolean }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-mist p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-ink">{accessPackage.name}</h3>
          <p className="mt-1 text-sm text-ink/65">
            {accessPackage.durationMinutes} minutes / {accessPackage.maxDevices} device{accessPackage.maxDevices > 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-md bg-white px-3 py-2 text-right text-sm font-black text-fern">
          {accessPackage.priceNativeToken} MON
          <div className="text-xs font-semibold text-ink/55">{accessPackage.priceUsd} USD</div>
        </div>
      </div>

      <Link
        href={`/checkout/${accessPackage.id}`}
        className={`mt-4 flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold ${
          disabled ? "pointer-events-none bg-ink/10 text-ink/40" : "bg-ink text-white transition hover:bg-fern"
        }`}
      >
        <ShoppingCart aria-hidden="true" size={17} />
        Select package
      </Link>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-mist p-3">
      <div className="flex items-center gap-2 text-sm text-ink/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 text-ink">
      <div className="font-bold">{title}</div>
      <p className="mt-2 text-sm text-ink/65">{body}</p>
    </div>
  );
}
