"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "@/lib/auth/client";

type AuthResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: {
        message?: string;
        status: number;
        statusText: string;
      };
    };

function getAuthErrorMessage<T>(result: AuthResponse<T>, fallbackMessage: string) {
  return result.error?.message || fallbackMessage;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordChecks(password: string) {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      passed: /\d/.test(password),
    },
  ];
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M21.81 12.23c0-.71-.06-1.39-.19-2.05H12.2v3.88h5.39a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.99-4.28 2.99-7.35Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 22c2.7 0 4.96-.89 6.62-2.42l-3.22-2.5c-.89.6-2.03.96-3.4.96-2.62 0-4.84-1.77-5.63-4.14H3.24v2.58A9.99 9.99 0 0 0 12.2 22Z"
        fill="#34A853"
      />
      <path
        d="M6.57 13.9a5.99 5.99 0 0 1 0-3.8V7.52H3.24a10.01 10.01 0 0 0 0 8.96l3.33-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87C17.15 2.95 14.9 2 12.2 2a9.99 9.99 0 0 0-8.96 5.52L6.57 10.1c.79-2.37 3.01-4.14 5.63-4.14Z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const baseInputClassName =
    "w-full rounded-[1.1rem] border border-[rgba(175,177,188,0.24)] bg-white/84 px-4 py-3.5 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-muted)]";
  const normalizedEmail = email.trim();
  const passwordChecks = getPasswordChecks(password);
  const passwordIsStrong = passwordChecks.every((check) => check.passed);
  const shouldShowEmailError =
    (normalizedEmail.length > 0 && !isValidEmail(normalizedEmail)) ||
    (submitAttempted && normalizedEmail.length === 0);
  const emailErrorMessage =
    normalizedEmail.length === 0
      ? "Enter your email address."
      : "Email format is incorrect. Use something like you@example.com.";
  const shouldShowPasswordError =
    (mode === "sign-up" && password.length > 0 && !passwordIsStrong) ||
    (submitAttempted && password.length === 0);
  const passwordErrorMessage =
    password.length === 0
      ? mode === "sign-up"
        ? "Create a password to continue."
        : "Enter your password."
      : "Password does not meet the requirements yet.";
  const shouldShowPasswordRequirements = mode === "sign-up" && password.length > 0;
  const isCreateAccountDisabled =
    pendingAction !== null ||
    !name.trim() ||
    normalizedEmail.length === 0 ||
    !isValidEmail(normalizedEmail) ||
    !passwordIsStrong;
  const isSignInDisabled =
    pendingAction !== null || normalizedEmail.length === 0 || !isValidEmail(normalizedEmail) || password.length === 0;

  function getInputClassName(isInvalid: boolean) {
    if (!isInvalid) {
      return baseInputClassName;
    }

    return `${baseInputClassName} border-[rgba(158,63,78,0.52)] bg-[rgba(255,231,235,0.48)]`;
  }

  async function handleGoogleSignIn() {
    if (!isConfigured) {
      setError("Neon Auth env is missing. Add NEON_AUTH_BASE_URL to enable auth.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction("google");

    try {
      const result = (await authClient.signIn.social({
        callbackURL: "/history",
        provider: "google",
      })) as AuthResponse<{
        redirect: boolean;
        token?: string;
        url?: string;
      }>;

      if (result.error) {
        setError(getAuthErrorMessage(result, "Google sign-in failed."));
        return;
      }

      if (result.data.url) {
        window.location.href = result.data.url;
        return;
      }

      setMessage("Opening Google sign-in...");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleEmailSubmit() {
    setSubmitAttempted(true);

    if (!isConfigured) {
      setError("Neon Auth env is missing. Add NEON_AUTH_BASE_URL to enable auth.");
      return;
    }

    if (!normalizedEmail || !password) {
      setError("Enter an email address and password first.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Email format is incorrect.");
      return;
    }

    if (mode === "sign-up" && !name.trim()) {
      setError("Enter your name before creating an account.");
      return;
    }

    if (mode === "sign-up" && !passwordIsStrong) {
      setError("Password does not meet the account requirements.");
      return;
    }

    setError(null);
    setMessage(null);
    setPendingAction(mode);

    try {
      if (mode === "sign-up") {
        const result = (await authClient.signUp.email({
          callbackURL: "/history",
          email: normalizedEmail,
          name: name.trim(),
          password,
        })) as AuthResponse<{
          token: string | null;
          user: {
            emailVerified: boolean;
          };
        }>;

        if (result.error) {
          setError(getAuthErrorMessage(result, "Account creation failed."));
          return;
        }

        if (!result.data.token) {
          setMessage("Account created. Check your email to finish sign-in.");
          return;
        }

        setMessage("Account created. Redirecting to history.");
      } else {
        const result = (await authClient.signIn.email({
          callbackURL: "/history",
          email: normalizedEmail,
          password,
        })) as AuthResponse<{
          redirect: boolean;
          token: string;
          url?: string;
        }>;

        if (result.error) {
          setError(getAuthErrorMessage(result, "Email sign-in failed."));
          return;
        }

        setMessage("Signed in. Redirecting to history.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setSubmitAttempted(false);
      startTransition(() => {
        router.push("/history");
        router.refresh();
      });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="surface-card mx-auto w-full max-w-3xl rounded-[2rem] p-8 shadow-[0_24px_70px_rgba(111,78,156,0.08)] sm:p-10 lg:p-12">
      <div className="max-w-2xl">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          className="material-button material-button-secondary flex w-full items-center justify-center gap-3 rounded-[1rem] px-5 py-3.5 text-sm"
        >
          <GoogleMark />
          {pendingAction === "google" ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span className="h-px flex-1 bg-[rgba(175,177,188,0.24)]" />
          <span>Email</span>
          <span className="h-px flex-1 bg-[rgba(175,177,188,0.24)]" />
        </div>

        <div className="mt-6 inline-flex rounded-full bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setSubmitAttempted(false);
              setError(null);
            }}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              mode === "sign-in"
                ? "bg-white text-[var(--color-foreground)] shadow-[0_8px_20px_rgba(111,78,156,0.08)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sign-up");
              setSubmitAttempted(false);
              setError(null);
            }}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              mode === "sign-up"
                ? "bg-white text-[var(--color-foreground)] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {mode === "sign-up" ? (
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-muted)]">Full name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className={getInputClassName(submitAttempted && !name.trim())}
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
              aria-invalid={shouldShowEmailError}
              className={getInputClassName(shouldShowEmailError)}
            />
            {shouldShowEmailError ? (
              <span className="text-sm leading-6 text-[var(--color-error)]">
                {emailErrorMessage}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
              aria-invalid={shouldShowPasswordError}
              className={getInputClassName(shouldShowPasswordError)}
            />
            {shouldShowPasswordError ? (
              <span className="text-sm leading-6 text-[var(--color-error)]">
                {passwordErrorMessage}
              </span>
            ) : null}
            {shouldShowPasswordRequirements ? (
              <div className="surface-muted p-4">
                <p className="eyebrow text-[var(--color-muted)]">Password requirements</p>
                <div className="mt-3 grid gap-2">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`flex items-center gap-2 text-sm ${
                        check.passed ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${
                          check.passed
                            ? "bg-[var(--color-accent)]"
                            : "bg-[rgba(175,177,188,0.48)]"
                        }`}
                      />
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </label>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-7 text-[var(--color-muted)]">
            {mode === "sign-up"
              ? "Create an account for synced critiques and workspace grouping."
              : "Use your existing account to reopen saved critiques."}
          </p>

          <button
            type="button"
            onClick={() => void handleEmailSubmit()}
            disabled={mode === "sign-up" ? isCreateAccountDisabled : isSignInDisabled}
            className="material-button material-button-primary min-w-40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === mode
              ? mode === "sign-up"
                ? "Creating..."
                : "Signing in..."
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-[1.25rem] bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-[1.25rem] bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="mt-5 rounded-[1.25rem] border border-[rgba(234,134,0,0.24)] bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-warning)]">
            Neon Auth is not configured yet. Add `NEON_AUTH_BASE_URL` before testing sign-in.
          </div>
        ) : null}
      </div>
    </section>
  );
}
