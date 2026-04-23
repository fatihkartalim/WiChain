import Link from "next/link";
import { ArrowRight, ShieldCheck, Wifi } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl content-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-fern/25 bg-white px-3 py-2 text-sm font-bold text-fern shadow-soft">
            <Wifi aria-hidden="true" size={17} />
            Monad Testnet
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">DePIN WiFi Marketplace</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
            Discover neighborhood hotspots, buy timed access packages, and start verified sessions with blockchain payments.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 font-semibold text-white transition hover:bg-fern">
              Sign in
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link href="/register" className="flex min-h-12 items-center justify-center rounded-md border border-ink/15 bg-white px-5 font-semibold text-ink transition hover:border-fern">
              Create account
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="grid gap-4">
            <PreviewRow title="Find nearby access" value="3 online" />
            <PreviewRow title="Fastest hotspot" value="310 Mbps" />
            <PreviewRow title="Payment network" value="MON" />
            <div className="rounded-md bg-fern p-5 text-white">
              <ShieldCheck aria-hidden="true" size={24} />
              <div className="mt-4 text-2xl font-black">Confirmed payment unlocks session start</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-ink/10 bg-mist p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold text-ink">{title}</span>
      <span className="font-black text-fern">{value}</span>
    </div>
  );
}
