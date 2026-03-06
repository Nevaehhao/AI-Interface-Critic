import Link from "next/link";

import { SignInPanel } from "@/components/auth/sign-in-panel";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.16),_transparent_32%),linear-gradient(180deg,#0b1020_0%,#090d18_54%,#070b14_100%)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <Link href="/" className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline">
          Back to landing
        </Link>
        <SignInPanel />
      </div>
    </main>
  );
}
