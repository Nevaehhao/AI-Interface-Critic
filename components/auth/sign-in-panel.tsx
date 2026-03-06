"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignInPanel({
  isConfigured,
}: {
  isConfigured: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    if (!isConfigured) {
      setError("Neon Auth env is missing. Add NEON_AUTH_BASE_URL to enable auth.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction("google");

    try {
      await authClient.signIn.social({
        callbackURL: "/history",
        provider: "google",
      });
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Google sign-in failed.",
      );
      setPendingAction(null);
    }
  }

  async function handleEmailSubmit() {
    if (!isConfigured) {
      setError("Neon Auth env is missing. Add NEON_AUTH_BASE_URL to enable auth.");
      return;
    }

    if (!email || !password) {
      setError("Enter an email address and password first.");
      return;
    }

    if (mode === "sign-up" && !name.trim()) {
      setError("Enter your name before creating an account.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction(mode);

    try {
      if (mode === "sign-up") {
        await authClient.signUp.email({
          callbackURL: "/history",
          email,
          name: name.trim(),
          password,
        });
        setMessage("Account created. Redirecting to your history.");
      } else {
        await authClient.signIn.email({
          callbackURL: "/history",
          email,
          password,
        });
        setMessage("Signed in. Redirecting to your history.");
      }

      startTransition(() => {
        router.push("/history");
        router.refresh();
      });
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : mode === "sign-up"
            ? "Account creation failed."
            : "Email sign-in failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="surface-card p-6 sm:p-8">
        <p className="eyebrow">Neon Auth</p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
          Sign in for saved analyses, history, and workspaces.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          This project now uses Neon Auth for Google and email/password access.
          Auth stays optional for local critique, but it is required for persistence,
          screenshots, and workspaces.
        </p>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            className="material-button material-button-secondary"
          >
            {pendingAction === "google" ? "Connecting Google..." : "Continue with Google"}
          </button>
        </div>

        <div className="surface-muted mt-6 p-5">
          <p className="eyebrow text-[var(--color-accent)]">Current auth setup</p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            Apple login was removed from the MVP because the Apple Developer Program is a paid
            dependency. Google and email cover the zero-cost path.
          </p>
        </div>
      </section>

      <aside className="surface-tonal space-y-5 p-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`material-button px-4 py-2 text-sm ${
                mode === "sign-in"
                  ? "material-button-primary"
                  : "material-button-secondary"
              }`}
            >
              Email sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`material-button px-4 py-2 text-sm ${
                mode === "sign-up"
                  ? "material-button-primary"
                  : "material-button-secondary"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-4 text-3xl tracking-tight">
            {mode === "sign-up" ? "Create an email account" : "Email access for returning users"}
          </h2>
        </div>

        {mode === "sign-up" ? (
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>
        ) : null}

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

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleEmailSubmit()}
          className="material-button material-button-primary w-full"
        >
          {pendingAction === mode
            ? mode === "sign-up"
              ? "Creating account..."
              : "Signing in..."
            : mode === "sign-up"
              ? "Create account"
              : "Sign in with email"}
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
