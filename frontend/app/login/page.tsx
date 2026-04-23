"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogIn, Mail, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { routeForRole } from "@/lib/auth-redirects";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("user@depin.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await loginUser({ email, password });
      const nextUrl = new URLSearchParams(window.location.search).get("next");
      router.replace(nextUrl ?? routeForRole(user.role));
    } catch (error) {
      setError(getApiErrorMessage(error, "Please check your email and password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-fern text-white">
          <Shield aria-hidden="true" size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-ink">Sign in</h1>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <span className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" aria-hidden="true" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-md border border-ink/15 bg-mist pl-10 pr-3 font-normal outline-none transition focus:border-fern focus:bg-white"
                required
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              className="min-h-12 w-full rounded-md border border-ink/15 bg-mist px-3 font-normal outline-none transition focus:border-fern focus:bg-white"
              required
            />
          </label>
          {error ? <div className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm font-semibold text-coral">{error}</div> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-4 font-semibold text-white transition hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn aria-hidden="true" size={18} />
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-sm text-ink/65">
          Need an account?{" "}
          <Link href="/register" className="font-bold text-fern">
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
