import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { hasNeonAuthConfig } from "@/lib/env";

export default function SignInPage() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-32 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="material-button material-button-text px-0">
            Back to landing
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="surface-muted p-6 sm:p-7">
            <p className="eyebrow">Use account</p>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
              Save critiques to Neon and reopen them later from history with workspace context.
            </p>
          </div>

          <Link
            href="/upload"
            className="surface-muted p-6 transition hover:bg-white/88 sm:p-7"
          >
            <p className="eyebrow">Skip account</p>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
              Go directly to upload when you only need a quick local critique.
            </p>
            <p className="mt-5 text-sm font-semibold text-[var(--color-accent)]">
              Continue to upload
            </p>
          </Link>
        </section>

        <SignInPanel isConfigured={hasNeonAuthConfig()} />
      </main>

      <SiteFooter />
    </div>
  );
}
