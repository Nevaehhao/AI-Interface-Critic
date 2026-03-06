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
      <section className="surface-card p-6 sm:p-8">
        <p className="eyebrow">
          Supabase Auth
        </p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
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
            className="material-button material-button-secondary"
          >
            {pendingProvider === "google" ? "Connecting Google..." : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => void handleProviderSignIn("apple")}
            className="material-button material-button-secondary"
          >
            {pendingProvider === "apple" ? "Connecting Apple..." : "Continue with Apple"}
          </button>
        </div>
      </section>

      <aside className="surface-tonal space-y-5 p-6">
        <div>
          <p className="eyebrow">
            Email magic link
          </p>
          <h2 className="mt-3 text-3xl tracking-tight">
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
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleEmailSignIn()}
          className="material-button material-button-primary w-full"
        >
          {pendingProvider === "email" ? "Sending magic link..." : "Send magic link"}
        </button>

        {message ? (
          <div className="rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
