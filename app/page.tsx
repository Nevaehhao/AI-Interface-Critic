const foundations = [
  "Next.js 16 App Router with TypeScript",
  "Tailwind CSS v4 design token setup",
  "Environment variable templates for OpenAI and Supabase",
  "Reusable utility helpers for future UI work",
];

const nextFeatures = [
  "Landing page",
  "Upload flow",
  "Loading experience",
  "Report interface",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,121,48,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(83,165,255,0.16),_transparent_28%),var(--color-surface)] text-[var(--color-foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
              AI Interface Critic
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Product scaffold is ready.
            </h1>
          </div>
          <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-[var(--color-muted)]">
            Feature 1 of 8
          </span>
        </header>

        <section className="grid gap-8 py-14 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-5">
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                The repo now has a stable application shell so the next features
                can focus on product UX instead of infrastructure churn.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                <span className="rounded-full border border-[var(--color-line)] px-3 py-1.5">
                  Type-safe foundation
                </span>
                <span className="rounded-full border border-[var(--color-line)] px-3 py-1.5">
                  Ready for auth and analysis APIs
                </span>
                <span className="rounded-full border border-[var(--color-line)] px-3 py-1.5">
                  Mobile-first layout system
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {foundations.map((item) => (
                <article
                  key={item}
                  className="rounded-3xl border border-[var(--color-line)] bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Foundation
                  </p>
                  <h2 className="mt-3 text-lg leading-7">{item}</h2>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(7,10,18,0.45)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
              Next in queue
            </p>
            <ol className="mt-5 space-y-4">
              {nextFeatures.map((feature, index) => (
                <li
                  key={feature}
                  className="flex items-start gap-4 rounded-2xl border border-white/6 bg-black/10 px-4 py-4"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/15 font-mono text-sm text-[var(--color-accent)]">
                    {index + 2}
                  </span>
                  <div>
                    <p className="text-base">{feature}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      Delivered on a dedicated feature branch, then merged back
                      into main.
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </main>
  );
}
