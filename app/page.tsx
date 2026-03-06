import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const productPillars = [
  {
    label: "Input",
    title: "A single UI screenshot",
    copy: "No project setup, no lengthy onboarding, and no design file import required for the MVP.",
  },
  {
    label: "Processing",
    title: "Structured AI UX analysis",
    copy: "The model critiques hierarchy, accessibility, layout, and interaction clarity instead of returning unshaped text.",
  },
  {
    label: "Output",
    title: "A report a designer can actually scan",
    copy: "Each issue becomes a readable card with impact, explanation, and next-step guidance.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload screenshot",
    copy: "Drop in a single interface image from a landing page, dashboard, checkout, or onboarding flow.",
  },
  {
    step: "02",
    title: "Wait through an intentional loading state",
    copy: "The app explains what it is checking so the delay feels like review, not dead air.",
  },
  {
    step: "03",
    title: "Review a structured critique",
    copy: "The result groups findings into predictable sections that match a UX review workflow.",
  },
];

const reportSections = [
  "Visual hierarchy",
  "Accessibility",
  "Interaction clarity",
  "Layout issues",
];

const sampleIssues = [
  {
    category: "Hierarchy",
    title: "Primary action lacks contrast",
    copy: "The main CTA blends into surrounding content and loses urgency during first scan.",
  },
  {
    category: "Accessibility",
    title: "Secondary text may fail readability",
    copy: "Muted labels are visually elegant, but some pairings risk insufficient contrast on smaller screens.",
  },
  {
    category: "Interaction",
    title: "Decision points feel visually equal",
    copy: "The interface does not clearly signal the preferred next action, which slows confident progression.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,143,61,0.18),_transparent_28%),radial-gradient(circle_at_90%_10%,_rgba(99,179,237,0.14),_transparent_24%),linear-gradient(180deg,#0b1020_0%,#090d18_54%,#070b14_100%)] text-[var(--color-foreground)]">
      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-14 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:pb-24 lg:pt-20">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Built for junior designers before review
            </div>

            <div className="space-y-6">
              <h1 className="max-w-4xl font-display text-5xl tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Turn a raw interface screenshot into a structured UX critique.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                AI Interface Critic analyzes a UI screenshot and returns a
                readable review covering visual hierarchy, accessibility,
                interaction clarity, and layout issues.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/upload">Start with a screenshot</ButtonLink>
              <ButtonLink href="#workflow" variant="secondary">
                See the workflow
              </ButtonLink>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {productPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {pillar.label}
                  </p>
                  <h2 className="mt-3 text-xl leading-7">{pillar.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {pillar.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.28),_transparent_62%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                    Review snapshot
                  </p>
                  <h2 className="mt-2 font-display text-3xl tracking-tight">
                    Portfolio-grade output, not raw model text.
                  </h2>
                </div>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  Report ready
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/8 bg-[#070b14]/80 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Overall UX signal
                    </p>
                    <p className="mt-2 text-5xl font-semibold text-white">78</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Main finding
                    </p>
                    <p className="mt-2 max-w-36 text-sm leading-6 text-white/85">
                      Primary action loses emphasis during first scan.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {sampleIssues.map((issue) => (
                    <div
                      key={issue.title}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-accent)]">
                          {issue.category}
                        </p>
                        <span className="rounded-full border border-white/8 px-2.5 py-1 text-xs text-[var(--color-muted)]">
                          Medium impact
                        </span>
                      </div>
                      <p className="mt-3 text-base text-white">{issue.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        {issue.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section
          id="workflow"
          className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                Workflow
              </p>
              <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
                A clear product loop from screenshot to critique.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              The MVP is intentionally narrow: one screenshot in, one
              structured UX review out. That keeps the experience focused and
              portfolio-ready.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/5 p-6"
              >
                <p className="font-mono text-sm text-[var(--color-accent)]">
                  {step.step}
                </p>
                <h3 className="mt-4 text-2xl tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="report-preview"
          className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-16"
        >
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
              Report architecture
            </p>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              The analysis output is shaped like a UX review, not a chat reply.
            </h2>
            <p className="max-w-xl text-base leading-7 text-[var(--color-muted)]">
              Hiring managers and teammates need structured reasoning. The
              report page will group findings by category and make each issue
              readable at a glance.
            </p>
            <div className="grid gap-3">
              {reportSections.map((section) => (
                <div
                  key={section}
                  className="rounded-2xl border border-[var(--color-line)] bg-white/5 px-4 py-4 text-sm text-white/90"
                >
                  {section}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {sampleIssues.map((issue) => (
                <article
                  key={`${issue.category}-${issue.title}`}
                  className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {issue.category}
                  </p>
                  <h3 className="mt-3 text-lg leading-7">{issue.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {issue.copy}
                  </p>
                  <p className="mt-4 text-sm text-white/85">
                    Suggestion: Increase the visual distinction of the most
                    important action and simplify competing emphasis.
                  </p>
                </article>
              ))}
              <article className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Coming next
                </p>
                <h3 className="mt-3 text-lg leading-7">Upload, loading, and report pages</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  The next branches will replace this static preview with a real
                  end-to-end screenshot analysis flow.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          id="system"
          className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16"
        >
          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                  System
                </p>
                <h2 className="mt-3 font-display text-4xl tracking-tight">
                  Problem, UX, and architecture stay connected.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
                The product starts with one user and one job to be done. From
                there, the system stays intentionally simple: Next.js for the
                interface, Ollama for critique generation, and Supabase for auth
                plus persistence.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <article className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  User
                </p>
                <p className="mt-3 text-base">Junior designer</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Frontend
                </p>
                <p className="mt-3 text-base">Next.js App Router + Tailwind</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  AI
                </p>
                <p className="mt-3 text-base">Ollama structured screenshot analysis</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Platform
                </p>
                <p className="mt-3 text-base">Supabase auth, storage, and persistence</p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
