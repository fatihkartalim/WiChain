"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CircleDollarSign, PackagePlus, Plus, Power, Router } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { PanelGrid, PanelMetric, ProtectedPanel } from "@/components/protected-panel";
import { useToast } from "@/contexts/toast-context";
import { queryKeys } from "@/lib/query-keys";
import { getOwnerAnalytics } from "@/services/analytics.service";
import { createHotspot, getHotspots, updateHotspot } from "@/services/hotspot.service";
import { createPackage, getPackagesByHotspot, updatePackage } from "@/services/package.service";
import type { Hotspot, HotspotPayload, PackagePayload } from "@/types/api";

const initialHotspot: HotspotPayload = {
  title: "",
  description: "",
  city: "",
  address: "",
  latitude: 39.9208,
  longitude: 32.8541,
  downloadSpeed: 100,
  uploadSpeed: 25,
  pricePerHour: 1,
  status: "DRAFT"
};

const initialPackage: PackagePayload = {
  hotspotId: "",
  name: "",
  durationMinutes: 60,
  priceUsd: "",
  priceNativeToken: "0.05",
  maxDevices: 1
};

export default function OwnerPage() {
  return (
    <AuthGuard allowedRoles={["NODE_OWNER", "ADMIN"]}>
      <OwnerContent />
    </AuthGuard>
  );
}

function OwnerContent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [hotspotForm, setHotspotForm] = useState(initialHotspot);
  const [packageForm, setPackageForm] = useState(initialPackage);

  const analytics = useQuery({ queryKey: queryKeys.ownerAnalytics, queryFn: getOwnerAnalytics });
  const hotspots = useQuery({ queryKey: [...queryKeys.hotspots, "owner-management"], queryFn: () => getHotspots({ sort: "newest" }) });
  const selectedHotspotId = packageForm.hotspotId || hotspots.data?.items[0]?.id || "";
  const packages = useQuery({
    queryKey: selectedHotspotId ? queryKeys.packages(selectedHotspotId) : ["packages", "none"],
    queryFn: () => getPackagesByHotspot(selectedHotspotId),
    enabled: Boolean(selectedHotspotId)
  });

  const invalidateInventory = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.hotspots });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminHotspots });
    if (selectedHotspotId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages(selectedHotspotId) });
    }
  };

  const createHotspotMutation = useMutation({
    mutationFn: createHotspot,
    onSuccess: () => {
      setHotspotForm(initialHotspot);
      invalidateInventory();
      showToast({ tone: "success", title: "Hotspot created", body: "The hotspot is available in mock inventory." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Hotspot failed", body: "The hotspot could not be created." });
    }
  });

  const updateHotspotMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Hotspot> }) => updateHotspot(id, payload),
    onSuccess: () => {
      invalidateInventory();
      showToast({ tone: "success", title: "Hotspot updated", body: "The status change was saved." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Update failed", body: "The hotspot status could not be changed." });
    }
  });

  const createPackageMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      setPackageForm((current) => ({ ...initialPackage, hotspotId: current.hotspotId }));
      invalidateInventory();
      showToast({ tone: "success", title: "Package created", body: "The access package is ready for checkout." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Package failed", body: "The package could not be created." });
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updatePackage(id, { isActive }),
    onSuccess: () => {
      invalidateInventory();
      showToast({ tone: "success", title: "Package updated", body: "The package availability was saved." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Update failed", body: "The package could not be changed." });
    }
  });

  const isBusy = createHotspotMutation.isPending || updateHotspotMutation.isPending || createPackageMutation.isPending || updatePackageMutation.isPending;
  const hotspotItems = hotspots.data?.items ?? [];
  const analyticsData = analytics.data;
  const maxRevenue = Math.max(...(analyticsData?.revenueSeries.map((item) => Number(item.value)) ?? [1]), 1);

  function handleHotspotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFiniteNumber(hotspotForm.latitude) || !isFiniteNumber(hotspotForm.longitude) || hotspotForm.downloadSpeed < 1 || hotspotForm.uploadSpeed < 1) {
      showToast({ tone: "error", title: "Check hotspot fields", body: "Coordinates and speeds must be valid numbers." });
      return;
    }
    createHotspotMutation.mutate(hotspotForm);
  }

  function handlePackageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHotspotId || packageForm.durationMinutes < 5 || packageForm.maxDevices < 1 || packageForm.maxDevices > 10) {
      showToast({ tone: "error", title: "Check package fields", body: "Select a hotspot and keep package values inside the contract limits." });
      return;
    }
    createPackageMutation.mutate({ ...packageForm, hotspotId: selectedHotspotId });
  }

  return (
    <ProtectedPanel title="Owner Panel" subtitle="Create hotspots, manage package inventory, and monitor revenue.">
      <div className="grid gap-5">
        <PanelGrid>
          <PanelMetric label="Total hotspots" value={(analyticsData?.summary.totalHotspots ?? hotspotItems.length).toString()} />
          <PanelMetric label="Revenue" value={`${analyticsData?.summary.totalRevenue ?? "0"} MON`} />
          <PanelMetric label="Average rating" value={(analyticsData?.summary.averageRating ?? 0).toFixed(1)} />
        </PanelGrid>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-bold text-fern">
            <BarChart3 aria-hidden="true" size={18} />
            Revenue series
          </div>
          {analytics.isLoading ? <StateBox title="Loading analytics" body="Fetching owner revenue and hotspot metrics." /> : null}
          {analytics.isError ? <StateBox title="Something went wrong" body="Owner analytics could not be loaded." /> : null}
          {analyticsData ? (
            <>
              <div className="mt-5 grid h-44 grid-cols-7 items-end gap-3 border-b border-ink/10 pb-3">
                {analyticsData.revenueSeries.map((item) => (
                  <div key={item.date} className="flex h-full min-w-0 flex-col justify-end gap-2">
                    <div className="text-center text-xs font-bold text-ink/65">{item.value}</div>
                    <div className="rounded-t-md bg-fern" style={{ height: `${Math.max(8, (Number(item.value) / maxRevenue) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-3">
                {analyticsData.revenueSeries.map((item) => (
                  <div key={item.date} className="truncate text-center text-xs font-semibold text-ink/55">
                    {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold text-fern">
              <Plus aria-hidden="true" size={18} />
              New hotspot
            </div>
            <form onSubmit={handleHotspotSubmit} className="mt-5 grid gap-3">
              <Input label="Title" value={hotspotForm.title} onChange={(value) => setHotspotForm({ ...hotspotForm, title: value })} required minLength={3} />
              <Textarea label="Description" value={hotspotForm.description} onChange={(value) => setHotspotForm({ ...hotspotForm, description: value })} required minLength={10} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="City" value={hotspotForm.city} onChange={(value) => setHotspotForm({ ...hotspotForm, city: value })} required minLength={2} />
                <Input label="Address" value={hotspotForm.address} onChange={(value) => setHotspotForm({ ...hotspotForm, address: value })} required minLength={5} />
                <NumberInput label="Latitude" value={hotspotForm.latitude} onChange={(value) => setHotspotForm({ ...hotspotForm, latitude: value })} />
                <NumberInput label="Longitude" value={hotspotForm.longitude} onChange={(value) => setHotspotForm({ ...hotspotForm, longitude: value })} />
                <NumberInput label="Download Mbps" value={hotspotForm.downloadSpeed} min={1} onChange={(value) => setHotspotForm({ ...hotspotForm, downloadSpeed: value })} />
                <NumberInput label="Upload Mbps" value={hotspotForm.uploadSpeed} min={1} onChange={(value) => setHotspotForm({ ...hotspotForm, uploadSpeed: value })} />
                <NumberInput label="Price per hour" value={hotspotForm.pricePerHour} min={0} step={0.01} onChange={(value) => setHotspotForm({ ...hotspotForm, pricePerHour: value })} />
                <label className="grid gap-1 text-sm font-semibold text-ink">
                  Status
                  <select className="min-h-11 rounded-md border border-ink/15 bg-mist px-3 outline-none focus:border-fern" value={hotspotForm.status} onChange={(event) => setHotspotForm({ ...hotspotForm, status: event.target.value as "DRAFT" | "ACTIVE" })}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </label>
              </div>
              <button disabled={createHotspotMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-fern disabled:opacity-60">
                <Plus aria-hidden="true" size={18} />
                {createHotspotMutation.isPending ? "Creating" : "Create hotspot"}
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold text-fern">
              <PackagePlus aria-hidden="true" size={18} />
              Package
            </div>
            <form onSubmit={handlePackageSubmit} className="mt-5 grid gap-3">
              <label className="grid gap-1 text-sm font-semibold text-ink">
                Hotspot
                <select className="min-h-11 rounded-md border border-ink/15 bg-mist px-3 outline-none focus:border-fern" value={selectedHotspotId} onChange={(event) => setPackageForm({ ...packageForm, hotspotId: event.target.value })} required>
                  {hotspotItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Name" value={packageForm.name} onChange={(value) => setPackageForm({ ...packageForm, name: value })} required minLength={2} />
              <NumberInput label="Duration minutes" value={packageForm.durationMinutes} min={5} onChange={(value) => setPackageForm({ ...packageForm, durationMinutes: value })} />
              <Input label="USD price" value={packageForm.priceUsd ?? ""} onChange={(value) => setPackageForm({ ...packageForm, priceUsd: value })} />
              <Input label="MON price" value={packageForm.priceNativeToken} onChange={(value) => setPackageForm({ ...packageForm, priceNativeToken: value })} required />
              <NumberInput label="Max devices" value={packageForm.maxDevices} min={1} max={10} onChange={(value) => setPackageForm({ ...packageForm, maxDevices: value })} />
              <button disabled={!selectedHotspotId || createPackageMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-fern disabled:opacity-60">
                <PackagePlus aria-hidden="true" size={18} />
                {createPackageMutation.isPending ? "Creating" : "Create package"}
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <ManagementList hotspots={hotspotItems} isLoading={hotspots.isLoading} isError={hotspots.isError} isBusy={isBusy} onStatus={(id, status) => updateHotspotMutation.mutate({ id, payload: { status, isOnline: status === "ACTIVE" } })} />
          <PackageList packages={packages.data ?? []} isLoading={packages.isLoading} isError={packages.isError} isBusy={isBusy} onToggle={(id, isActive) => updatePackageMutation.mutate({ id, isActive })} />
        </section>
      </div>
    </ProtectedPanel>
  );
}

function ManagementList({ hotspots, isLoading, isError, isBusy, onStatus }: { hotspots: Hotspot[]; isLoading: boolean; isError: boolean; isBusy: boolean; onStatus: (id: string, status: Hotspot["status"]) => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-bold text-fern">
        <Router aria-hidden="true" size={18} />
        Hotspots
      </div>
      <div className="mt-4 grid gap-3">
        {isLoading ? <StateBox title="Loading hotspots" body="Fetching owner inventory." /> : null}
        {isError ? <StateBox title="Something went wrong" body="Hotspots could not be loaded." /> : null}
        {!isLoading && !isError && hotspots.length === 0 ? <StateBox title="No hotspots" body="Create the first hotspot to sell access packages." /> : null}
        {hotspots.map((item) => (
          <article key={item.id} className="rounded-lg border border-ink/10 bg-mist p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="font-black text-ink">{item.title}</h2>
                <p className="mt-1 text-sm text-ink/65">{item.city} / {item.downloadSpeed} Mbps / {item.pricePerHour} MON hourly</p>
              </div>
              <div className="rounded-md bg-white px-3 py-2 text-xs font-black uppercase text-ink">{item.status}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Action disabled={isBusy || item.status === "ACTIVE"} onClick={() => onStatus(item.id, "ACTIVE")} icon={<Power size={16} />} label="Activate" />
              <Action disabled={isBusy || item.status === "OFFLINE"} onClick={() => onStatus(item.id, "OFFLINE")} icon={<Power size={16} />} label="Offline" />
              <Action disabled={isBusy || item.status === "ARCHIVED"} onClick={() => onStatus(item.id, "ARCHIVED")} icon={<Power size={16} />} label="Archive" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PackageList({ packages, isLoading, isError, isBusy, onToggle }: { packages: Array<{ id: string; name: string; durationMinutes: number; priceNativeToken: string; maxDevices: number; isActive: boolean }>; isLoading: boolean; isError: boolean; isBusy: boolean; onToggle: (id: string, isActive: boolean) => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-bold text-fern">
        <CircleDollarSign aria-hidden="true" size={18} />
        Packages
      </div>
      <div className="mt-4 grid gap-3">
        {isLoading ? <StateBox title="Loading packages" body="Fetching packages for the selected hotspot." /> : null}
        {isError ? <StateBox title="Something went wrong" body="Packages could not be loaded." /> : null}
        {!isLoading && !isError && packages.length === 0 ? <StateBox title="No packages" body="Create a package for the selected hotspot." /> : null}
        {packages.map((item) => (
          <article key={item.id} className="rounded-lg border border-ink/10 bg-mist p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-ink">{item.name}</h2>
                <p className="mt-1 text-sm text-ink/65">{item.durationMinutes} min / {item.priceNativeToken} MON / {item.maxDevices} devices</p>
              </div>
              <button disabled={isBusy} onClick={() => onToggle(item.id, !item.isActive)} className="rounded-md bg-white px-3 py-2 text-xs font-black uppercase text-ink transition hover:text-fern disabled:opacity-60">
                {item.isActive ? "Active" : "Paused"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Input({ label, value, onChange, required, minLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; minLength?: number }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-ink">
      {label}
      <input required={required} minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-ink/15 bg-mist px-3 outline-none focus:border-fern" />
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-ink">
      {label}
      <input required type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="min-h-11 rounded-md border border-ink/15 bg-mist px-3 outline-none focus:border-fern" />
    </label>
  );
}

function Textarea({ label, value, onChange, required, minLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; minLength?: number }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-ink">
      {label}
      <textarea required={required} minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 rounded-md border border-ink/15 bg-mist px-3 py-2 outline-none focus:border-fern" />
    </label>
  );
}

function Action({ disabled, onClick, icon, label }: { disabled: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button disabled={disabled} onClick={onClick} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink transition hover:border-fern hover:text-fern disabled:opacity-50">
      {icon}
      {label}
    </button>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 text-ink">
      <div className="font-bold">{title}</div>
      <p className="mt-2 text-sm text-ink/65">{body}</p>
    </div>
  );
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}
