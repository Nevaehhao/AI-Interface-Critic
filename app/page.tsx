import { HomeHeroAuthAction, HomeStatusAuthAction } from "@/components/home/home-auth-actions";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const steps = [
  {
    description: "Upload a screenshot or let the app capture a live URL, then attach page, repo, goal, and stack context.",
    title: "1. Capture",
  },
  {
    description: "Run a UX, accessibility, conversion, design system, or implementation-handoff review with your own model.",
    title: "2. Critique",
  },
  {
    description: "Triage issues, compare runs, review flow-level patterns, then pass JSON or a builder brief into your coding workflow.",
    title: "3. Build",
  },
];

const reportAreas = [
  "Overall score and main finding",
  "Visual hierarchy issues",
  "Accessibility issues",
  "Interaction clarity issues",
  "Layout issues and redesign suggestions",
  "Issue triage and comparison views",
  "History search, trends, and flow review",
  "Full-stack implementation handoff",
];

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <section className="surface-card p-8 sm:p-10">
          <div className="max-w-3xl">
            <p className="eyebrow">AI Interface Critic</p>
            <h1 className="mt-4 max-w-4xl text-4xl tracking-tight sm:text-5xl lg:text-[3.9rem]">
              Minimal UI review, sharper implementation handoff.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Upload a screenshot, add page or repo context, and get a structured review that feels
              like a senior UI/UX designer plus a pragmatic full-stack engineer working together.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/upload">Start analysis</ButtonLink>
            <HomeHeroAuthAction />
            <ButtonLink href="/report/demo" variant="secondary">
              View demo report
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
              A quieter layout you can scan quickly.
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
              Open-source first, with a visible fallback.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--color-muted)]">
              <p>The app works with Ollama or a hosted OpenAI-compatible API.</p>
              <p>It also supports Anthropic and Gemini without changing the product workflow.</p>
              <p>
                If the configured provider fails, the report explicitly shows fallback output so you
                never have to guess why a run looks repeated.
              </p>
              <p>
                Reports now include triage, compare, share links, and a builder CLI path from
                critique into local repo work.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/setup" variant="secondary">
                Check setup
              </ButtonLink>
              <HomeStatusAuthAction />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
