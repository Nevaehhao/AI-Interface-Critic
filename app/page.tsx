import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const steps = [
  {
    description: "Upload one UI screenshot. PNG, JPG, or WebP.",
    title: "1. Upload",
  },
  {
    description: "The app checks hierarchy, accessibility, interaction, and layout.",
    title: "2. Analyze",
  },
  {
    description: "Read a simple report with issues, suggestions, and a clear next step.",
    title: "3. Review",
  },
];

const reportAreas = [
  "Overall score and main finding",
  "Visual hierarchy issues",
  "Accessibility issues",
  "Interaction clarity issues",
  "Layout issues and redesign suggestions",
];

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <section className="surface-card p-8 sm:p-10">
          <div className="max-w-3xl">
            <p className="eyebrow">AI Interface Critic</p>
            <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Upload a screenshot and get a clear UX critique.
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              This app is built for one job: turn a UI screenshot into a simple report you can act
              on. No chat thread, no noisy dashboard, no extra setup before the first analysis.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/upload">Start analysis</ButtonLink>
            <ButtonLink href="/report/demo" variant="secondary">
              View demo report
            </ButtonLink>
            <ButtonLink href="/history" variant="text">
              Open history
            </ButtonLink>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="surface-card p-6">
              <p className="eyebrow">{step.title}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{step.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card p-8">
            <p className="eyebrow">What the report includes</p>
            <h2 className="mt-4 text-3xl tracking-tight sm:text-4xl">
              A simple structure you can scan quickly.
            </h2>
            <div className="mt-6 grid gap-3">
              {reportAreas.map((area) => (
                <div key={area} className="surface-muted px-4 py-4 text-sm text-[var(--color-muted)]">
                  {area}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8">
            <p className="eyebrow">System status</p>
            <h2 className="mt-4 text-3xl tracking-tight sm:text-4xl">
              Local-first, with a visible fallback.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--color-muted)]">
              <p>The app tries Ollama first for real screenshot analysis.</p>
              <p>
                If Ollama fails, the report now shows that it used fallback output, so you do not
                have to guess why a score looks repeated.
              </p>
              <p>
                History stores recent reports locally in the browser, and can also sync to Neon
                when you configure cloud persistence.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/setup" variant="secondary">
                Check setup
              </ButtonLink>
              <ButtonLink href="/auth/sign-in" variant="text">
                Sign in
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
