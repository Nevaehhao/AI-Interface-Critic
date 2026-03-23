import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { hasNeonAuthConfig } from "@/lib/env";

export default function SignInPage() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-screen-2xl flex-col gap-8 px-6 pb-20 pt-32 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="material-button material-button-text px-0">
            Back to landing
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr] xl:items-start">
          <div className="surface-card p-7 sm:p-10">
            <p className="eyebrow">Account access</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
              Sync critiques across devices only when you need to.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Local analysis works without an account. Sign in only when you want durable history,
              shared workspace buckets, and report continuity across machines.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="surface-muted p-5">
                <p className="eyebrow">Use account</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Save critiques to Neon and reopen them from history with full workspace context.
                </p>
              </div>
              <div className="surface-muted p-5">
                <p className="eyebrow">Skip account</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Continue directly to upload if you only need a local one-off review.
                </p>
              </div>
            </div>
          </div>

          <SignInPanel isConfigured={hasNeonAuthConfig()} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
