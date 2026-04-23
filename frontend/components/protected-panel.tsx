import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { logout, user } = useAuth();

  return (
    <main className="min-h-screen px-5 py-6">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-fern">
              <ArrowLeft aria-hidden="true" size={17} />
              Dashboard
            </Link>
            <h1 className="mt-3 break-words text-3xl font-black text-ink">{title}</h1>
            <p className="mt-2 text-sm text-ink/65">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-soft">
              {user?.role}
            </div>
            <button
              onClick={logout}
              className="grid h-11 w-11 place-items-center rounded-md border border-ink/15 bg-white text-ink transition hover:border-coral hover:text-coral"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </header>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}

export function PanelGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}

export function PanelMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="text-sm font-semibold text-ink/55">{label}</div>
      <div className="mt-2 break-words text-2xl font-black text-ink">{value}</div>
    </div>
  );
}
