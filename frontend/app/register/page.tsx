"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { routeForRole } from "@/lib/auth-redirects";
import type { UserRole } from "@/types/api";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "ADMIN">>("USER");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await registerUser({ name, email, password, role });
      router.replace(routeForRole(user.role));
    } catch (error) {
      setError(getApiErrorMessage(error, "Please check the form fields."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-lg rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-fern text-white">
          <UserPlus aria-hidden="true" size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-ink">Create account</h1>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              className="min-h-12 rounded-md border border-ink/15 bg-mist px-3 font-normal outline-none transition focus:border-fern focus:bg-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={120}
              className="min-h-12 rounded-md border border-ink/15 bg-mist px-3 font-normal outline-none transition focus:border-fern focus:bg-white"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={64}
              className="min-h-12 rounded-md border border-ink/15 bg-mist px-3 font-normal outline-none transition focus:border-fern focus:bg-white"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <RoleButton active={role === "USER"} label="User" onClick={() => setRole("USER")} />
            <RoleButton active={role === "NODE_OWNER"} label="Node owner" onClick={() => setRole("NODE_OWNER")} />
          </div>
          {error ? <div className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm font-semibold text-coral">{error}</div> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 rounded-md bg-ink px-4 font-semibold text-white transition hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-sm text-ink/65">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-fern">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

function RoleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-md border px-3 text-sm font-bold transition ${
        active ? "border-fern bg-fern text-white" : "border-ink/15 bg-mist text-ink hover:border-fern"
      }`}
    >
      {label}
    </button>
  );
}
