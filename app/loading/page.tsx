import Link from "next/link";

export default function LoadingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.15),_transparent_32%),var(--color-surface)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Next feature
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Loading state lands on the next branch.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            The upload flow now hands off cleanly into this route. The next
            milestone will replace this placeholder with staged analysis states
            and automatic report navigation.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Planned states
          </p>
          <ul className="mt-4 space-y-3 text-[var(--color-muted)]">
            <li>Analyzing visual hierarchy</li>
            <li>Checking accessibility</li>
            <li>Evaluating layout structure</li>
          </ul>
        </div>

        <Link href="/upload" className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline">
          Back to upload page
        </Link>
      </div>
    </main>
  );
}
