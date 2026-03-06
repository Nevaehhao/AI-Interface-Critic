import Link from "next/link";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.15),_transparent_32%),var(--color-surface)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Next feature
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Upload flow lands on the next branch.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            This route exists so the landing page CTA resolves cleanly. The
            next milestone will replace this placeholder with drag-and-drop
            upload, validation, and screenshot preview.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Planned deliverables
          </p>
          <ul className="mt-4 space-y-3 text-[var(--color-muted)]">
            <li>PNG and JPG file validation</li>
            <li>Preview before analysis</li>
            <li>Direct handoff into loading state</li>
          </ul>
        </div>

        <Link href="/" className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline">
          Back to landing page
        </Link>
      </div>
    </main>
  );
}
