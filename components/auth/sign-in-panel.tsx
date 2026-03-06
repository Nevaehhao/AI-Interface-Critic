"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getAuthRedirectPath() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/auth/callback?next=/history`;
}

export function SignInPanel() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [supabase] = useState(() => createSupabaseBrowserClient());

  async function handleProviderSignIn(provider: "google" | "apple") {
    if (!supabase) {
      setError("Supabase env is missing. Add project credentials to enable auth.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingProvider(provider);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: getAuthRedirectPath(),
      },
      provider,
    });

    if (authError) {
      setError(authError.message);
      setPendingProvider(null);
    }
  }

  async function handleEmailSignIn() {
    if (!supabase) {
      setError("Supabase env is missing. Add project credentials to enable auth.");
      return;
    }

    if (!email) {
      setError("Enter an email address first.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingProvider("email");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAuthRedirectPath(),
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setError(authError.message);
      setPendingProvider(null);
      return;
    }

    setMessage("Magic link sent. Open your email to continue.");
    setPendingProvider(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
          Supabase Auth
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Sign in for saved analyses and history.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          This project now supports Google, Apple, and email magic-link sign-in
          through Supabase. Auth is optional for the core upload flow, but it is
          required for persistence and history.
        </p>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => void handleProviderSignIn("google")}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            {pendingProvider === "google" ? "Connecting Google..." : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => void handleProviderSignIn("apple")}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            {pendingProvider === "apple" ? "Connecting Apple..." : "Continue with Apple"}
          </button>
        </div>
      </section>

      <aside className="space-y-5 rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Email magic link
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            Email sign-in for low-friction access
          </h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Work email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[1.25rem] border border-white/10 bg-[#090d18] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleEmailSignIn()}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-[#ff9d57]"
        >
          {pendingProvider === "email" ? "Sending magic link..." : "Send magic link"}
        </button>

        {message ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
