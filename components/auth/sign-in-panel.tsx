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
      setError(authError instanceof Error ? authError.message : "Google sign-in failed.");
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
        setMessage("Account created. Redirecting to history.");
      } else {
        await authClient.signIn.email({
          callbackURL: "/history",
          email,
          password,
        });
        setMessage("Signed in. Redirecting to history.");
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
    <section className="surface-card max-w-2xl p-6 sm:p-8">
      <p className="eyebrow">Sign in</p>
      <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">Use Google or email.</h1>
      <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
        Sign-in is optional for local use. It is only needed if you want synced history and
        workspaces across devices.
      </p>

      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        className="material-button material-button-secondary mt-6"
      >
        {pendingAction === "google" ? "Connecting..." : "Continue with Google"}
      </button>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`material-button px-4 py-2 text-sm ${
            mode === "sign-in" ? "material-button-primary" : "material-button-secondary"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`material-button px-4 py-2 text-sm ${
            mode === "sign-up" ? "material-button-primary" : "material-button-secondary"
          }`}
        >
          Create account
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {mode === "sign-up" ? (
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void handleEmailSubmit()}
        className="material-button material-button-primary mt-6 w-full sm:w-auto"
      >
        {pendingAction === mode
          ? mode === "sign-up"
            ? "Creating..."
            : "Signing in..."
          : mode === "sign-up"
            ? "Create account"
            : "Sign in with email"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}
