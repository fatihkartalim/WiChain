"use client";

import { AuthGuard } from "@/components/auth-guard";
import { ProtectedPanel } from "@/components/protected-panel";
import { useAuth } from "@/contexts/auth-context";

export default function ProfilePage() {
  return (
    <AuthGuard allowedRoles={["USER", "NODE_OWNER", "ADMIN"]}>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user } = useAuth();

  return (
    <ProtectedPanel title="Profile" subtitle="Account identity and wallet status.">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <dl className="grid gap-4 sm:grid-cols-2">
          <ProfileItem label="Name" value={user?.name ?? "-"} />
          <ProfileItem label="Email" value={user?.email ?? "-"} />
          <ProfileItem label="Role" value={user?.role ?? "-"} />
          <ProfileItem label="Wallet" value={user?.walletAddress ?? "Not connected"} />
        </dl>
      </div>
    </ProtectedPanel>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-ink/55">{label}</dt>
      <dd className="mt-1 break-words font-bold text-ink">{value}</dd>
    </div>
  );
}
