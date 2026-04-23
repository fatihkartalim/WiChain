"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserRoundCog, Wifi, Archive, Ban, CheckCircle2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { PanelGrid, PanelMetric, ProtectedPanel } from "@/components/protected-panel";
import { useToast } from "@/contexts/toast-context";
import { queryKeys } from "@/lib/query-keys";
import { getAdminHotspots, getUsers } from "@/services/admin.service";
import { deleteHotspot, updateHotspot } from "@/services/hotspot.service";
import type { AdminUser, Hotspot } from "@/types/api";

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const users = useQuery({ queryKey: queryKeys.adminUsers, queryFn: getUsers });
  const hotspots = useQuery({ queryKey: queryKeys.adminHotspots, queryFn: getAdminHotspots });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminHotspots });
    queryClient.invalidateQueries({ queryKey: queryKeys.hotspots });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Hotspot["status"] }) => updateHotspot(id, { status, isOnline: status === "ACTIVE" }),
    onSuccess: () => {
      invalidate();
      showToast({ tone: "success", title: "Moderation saved", body: "The hotspot status was updated." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Moderation failed", body: "The hotspot status could not be updated." });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: deleteHotspot,
    onSuccess: () => {
      invalidate();
      showToast({ tone: "success", title: "Hotspot archived", body: "The record was moved out of active circulation." });
    },
    onError: () => {
      showToast({ tone: "error", title: "Archive failed", body: "The hotspot could not be archived." });
    }
  });

  const userItems = users.data?.items ?? [];
  const hotspotItems = hotspots.data?.items ?? [];
  const flagged = hotspotItems.filter((item) => item.status === "SUSPENDED" || item.status === "OFFLINE").length;
  const isBusy = statusMutation.isPending || archiveMutation.isPending;

  return (
    <ProtectedPanel title="Admin Panel" subtitle="Marketplace moderation and platform records.">
      <div className="grid gap-5">
        <PanelGrid>
          <PanelMetric label="Users" value={userItems.length.toString()} />
          <PanelMetric label="Hotspots" value={hotspotItems.length.toString()} />
          <PanelMetric label="Flagged" value={flagged.toString()} />
        </PanelGrid>

        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <UsersTable users={userItems} isLoading={users.isLoading} isError={users.isError} />
          <HotspotsTable
            hotspots={hotspotItems}
            isLoading={hotspots.isLoading}
            isError={hotspots.isError}
            isBusy={isBusy}
            onApprove={(id) => statusMutation.mutate({ id, status: "ACTIVE" })}
            onSuspend={(id) => statusMutation.mutate({ id, status: "SUSPENDED" })}
            onArchive={(id) => archiveMutation.mutate(id)}
          />
        </section>
      </div>
    </ProtectedPanel>
  );
}

function UsersTable({ users, isLoading, isError }: { users: AdminUser[]; isLoading: boolean; isError: boolean }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-bold text-fern">
        <UserRoundCog aria-hidden="true" size={18} />
        Users
      </div>
      <div className="mt-4 grid gap-3">
        {isLoading ? <StateBox title="Loading users" body="Fetching marketplace accounts." /> : null}
        {isError ? <StateBox title="Something went wrong" body="Users could not be loaded." /> : null}
        {!isLoading && !isError && users.length === 0 ? <StateBox title="No users" body="No platform users are available yet." /> : null}
        {users.map((user) => (
          <article key={user.id} className="rounded-lg border border-ink/10 bg-mist p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-black text-ink">{user.name}</h2>
                <p className="mt-1 truncate text-sm text-ink/65">{user.email}</p>
              </div>
              <div className="rounded-md bg-white px-3 py-2 text-xs font-black uppercase text-ink">{user.role}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HotspotsTable({ hotspots, isLoading, isError, isBusy, onApprove, onSuspend, onArchive }: { hotspots: Hotspot[]; isLoading: boolean; isError: boolean; isBusy: boolean; onApprove: (id: string) => void; onSuspend: (id: string) => void; onArchive: (id: string) => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-bold text-fern">
        <ShieldAlert aria-hidden="true" size={18} />
        Hotspot moderation
      </div>
      <div className="mt-4 grid gap-3">
        {isLoading ? <StateBox title="Loading hotspots" body="Fetching platform hotspot records." /> : null}
        {isError ? <StateBox title="Something went wrong" body="Hotspots could not be loaded." /> : null}
        {!isLoading && !isError && hotspots.length === 0 ? <StateBox title="No hotspots" body="No hotspot records are available yet." /> : null}
        {hotspots.map((item) => (
          <article key={item.id} className="rounded-lg border border-ink/10 bg-mist p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h2 className="font-black text-ink">{item.title}</h2>
                <p className="mt-1 text-sm text-ink/65">{item.city} / owner {item.ownerId.slice(0, 8)} / {item.downloadSpeed} Mbps</p>
              </div>
              <div className="flex items-center gap-2">
                <Wifi aria-hidden="true" size={16} className={item.isOnline ? "text-fern" : "text-coral"} />
                <span className="rounded-md bg-white px-3 py-2 text-xs font-black uppercase text-ink">{item.status}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Action disabled={isBusy || item.status === "ACTIVE"} onClick={() => onApprove(item.id)} icon={<CheckCircle2 size={16} />} label="Approve" />
              <Action disabled={isBusy || item.status === "SUSPENDED"} onClick={() => onSuspend(item.id)} icon={<Ban size={16} />} label="Suspend" />
              <Action disabled={isBusy || item.status === "ARCHIVED"} onClick={() => onArchive(item.id)} icon={<Archive size={16} />} label="Archive" />
            </div>
          </article>
        ))}
      </div>
    </section>
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
