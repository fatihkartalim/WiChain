"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Filter, LocateFixed, LogOut, Search, UserRound, X } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { HotspotCard } from "@/components/hotspot-card";
import { HotspotMapPreview } from "@/components/hotspot-map-preview";
import { WalletButton } from "@/components/wallet-button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useGeolocation } from "@/hooks/use-geolocation";
import { distanceKm } from "@/lib/location";
import { queryKeys } from "@/lib/query-keys";
import { getHotspots } from "@/services/hotspot.service";
import type { SortOption } from "@/types/api";

export default function DashboardPage() {
  return (
    <AuthGuard allowedRoles={["USER", "NODE_OWNER", "ADMIN"]}>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useGeolocation();
  const lastLocationNotice = useRef<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("distance");
  const [radiusKm, setRadiusKm] = useState(5);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.hotspots, { search, sort, radiusKm, location: location.coordinates }],
    queryFn: () => getHotspots({ search, sort, radiusKm, lat: location.coordinates?.latitude, lng: location.coordinates?.longitude, limit: 12 })
  });

  const hotspots = useMemo(() => {
    const items = data?.items ?? [];
    const normalized = search.trim().toLowerCase();
    let results = items.map((item) => {
      if (!location.coordinates) {
        return item;
      }

      return {
        ...item,
        distanceKm: Number(distanceKm(location.coordinates, { latitude: item.latitude, longitude: item.longitude }).toFixed(1))
      };
    });

    if (location.coordinates) {
      results = results.filter((item) => (item.distanceKm ?? Infinity) <= radiusKm);
    }

    if (normalized) {
      results = results.filter((item) => [item.title, item.city, item.address].join(" ").toLowerCase().includes(normalized));
    }

    if (sort === "distance") {
      results = [...results].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return results;
  }, [data?.items, location.coordinates, radiusKm, search, sort]);

  useEffect(() => {
    if (location.error && lastLocationNotice.current !== location.error) {
      lastLocationNotice.current = location.error;
      showToast({ tone: "error", title: "Location unavailable", body: location.error });
    }
  }, [location.error, showToast]);

  useEffect(() => {
    if (location.coordinates && lastLocationNotice.current !== "location-ready") {
      lastLocationNotice.current = "location-ready";
      showToast({ tone: "success", title: "Nearby discovery enabled", body: "Distances and radius filtering now use your browser location." });
    }
  }, [location.coordinates, showToast]);

  function handleLocationRequest() {
    location.requestLocation();
    showToast({ tone: "info", title: "Requesting location", body: "Your browser may ask for permission before nearby sorting is enabled." });
  }

  function handleClearLocation() {
    location.clearLocation();
    showToast({ tone: "info", title: "Location cleared", body: "Discovery is using mock distances again." });
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold uppercase text-fern">Monad Testnet</div>
          <h1 className="text-2xl font-black text-ink sm:text-3xl">Hotspot Discovery</h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <a href="/profile" className="flex min-h-11 max-w-full items-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink transition hover:border-fern">
            <UserRound aria-hidden="true" size={18} />
            <span className="max-w-32 truncate">{user?.name}</span>
          </a>
          <WalletButton />
          <button
            onClick={logout}
            className="grid h-11 w-11 place-items-center rounded-md border border-ink/15 bg-white text-ink transition hover:border-coral hover:text-coral"
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden="true" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by hotspot, city, or address"
                  className="min-h-12 w-full rounded-md border border-ink/15 bg-mist pl-10 pr-3 text-ink outline-none transition focus:border-fern focus:bg-white"
                />
              </label>
              <label className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden="true" size={18} />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="min-h-12 w-full appearance-none rounded-md border border-ink/15 bg-mist pl-10 pr-8 text-ink outline-none transition focus:border-fern focus:bg-white"
                >
                  <option value="distance">Nearest first</option>
                  <option value="price">Lowest price</option>
                  <option value="rating">Top rated</option>
                  <option value="speed">Fastest</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                <span className="flex items-center gap-2">
                  <Crosshair aria-hidden="true" size={17} />
                  Radius {radiusKm} km
                </span>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(Number(event.target.value))}
                  className="w-full accent-fern"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleLocationRequest}
                  disabled={location.isLoading}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-fern disabled:opacity-60 sm:flex-none"
                >
                  <LocateFixed aria-hidden="true" size={18} />
                  {location.isLoading ? "Locating" : "Use location"}
                </button>
                {location.coordinates ? (
                  <button
                    onClick={handleClearLocation}
                    className="grid h-11 w-11 place-items-center rounded-md border border-ink/15 bg-white text-ink transition hover:border-coral hover:text-coral"
                    aria-label="Clear location"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                ) : null}
              </div>
            </div>
            {location.error ? <p className="mt-3 text-sm font-semibold text-coral">{location.error}</p> : null}
            {location.coordinates ? (
              <p className="mt-3 text-sm text-ink/65">
                Using browser location {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)} for nearby filtering.
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading ? <StateBox title="Loading hotspots" body="Fetching available access points." /> : null}
            {isError ? <StateBox title="Something went wrong" body="The hotspot list could not be loaded." /> : null}
            {!isLoading && !isError && hotspots.length === 0 ? <StateBox title="No hotspots found" body="Try another search or filter." /> : null}
            {!isLoading && !isError ? hotspots.map((hotspot) => <HotspotCard key={hotspot.id} hotspot={hotspot} />) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <HotspotMapPreview hotspots={hotspots} userLocation={location.coordinates} radiusKm={radiusKm} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Summary label="Online" value={hotspots.filter((item) => item.isOnline).length.toString()} />
            <Summary label="Avg Mbps" value={average(hotspots.map((item) => item.downloadSpeed))} />
            <Summary label="Avg Rating" value={average(hotspots.map((item) => item.rating), 1)} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 text-ink shadow-soft">
      <div className="font-bold">{title}</div>
      <p className="mt-2 text-sm text-ink/65">{body}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="text-xs font-semibold uppercase text-ink/55">{label}</div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
    </div>
  );
}

function average(values: number[], decimals = 0) {
  if (values.length === 0) {
    return "0";
  }

  const result = values.reduce((sum, value) => sum + value, 0) / values.length;
  return result.toFixed(decimals);
}
