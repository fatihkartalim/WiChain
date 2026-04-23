"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/api";

export function AuthGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [allowedRoles, isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return <GuardState title="Checking access" body="Loading your session." />;
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <GuardState title="Redirecting" body="Taking you to the right page." />;
  }

  return <>{children}</>;
}

function GuardState({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 text-ink shadow-soft">
        <div className="font-bold">{title}</div>
        <p className="mt-2 text-sm text-ink/65">{body}</p>
      </div>
    </main>
  );
}
