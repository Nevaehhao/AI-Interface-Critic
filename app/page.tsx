import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const productPillars = [
  {
    label: "Input",
    title: "One screenshot, no setup ceremony",
    copy: "Upload a UI image from a landing page, dashboard, checkout flow, or onboarding screen and start the review immediately.",
  },
  {
    label: "Analysis",
    title: "A structured critique, not model rambling",
    copy: "The system evaluates hierarchy, accessibility, layout, and interaction clarity as separate UX concerns.",
  },
  {
    label: "Output",
    title: "Readable cards for a real review session",
    copy: "Every issue includes impact, explanation, and a practical next step so the report feels product-ready.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload screenshot",
    copy: "Bring a single interface image into the flow with drag-and-drop or the file picker.",
  },
  {
    step: "02",
    title: "Watch the critique progress",
    copy: "The loading page explains what the model is checking, so the wait feels like a review in progress.",
  },
  {
    step: "03",
    title: "Read a sectioned report",
    copy: "Results are grouped into predictable categories that map to an actual UX review workflow.",
  },
];

const reportSections = [
  {
    title: "Visual hierarchy",
    copy: "Spot competing CTAs, weak entry points, and missing emphasis.",
    tone: "status-badge-primary",
  },
  {
    title: "Accessibility",
    copy: "Call out contrast, scanability, and readability risks.",
    tone: "status-badge-success",
  },
  {
    title: "Interaction clarity",
    copy: "Find unclear next steps and weak signals around intended actions.",
    tone: "status-badge-warning",
  },
  {
    title: "Layout issues",
    copy: "Surface density, spacing, and structure problems before review.",
    tone: "status-badge-error",
  },
];

const sampleIssues = [
  {
    category: "Hierarchy",
    title: "Primary action is visually equal to secondary content",
    copy: "The CTA blends into neighboring blocks, so first-scan attention is diffused instead of directed.",
  },
  {
    category: "Accessibility",
    title: "Muted text risks low readability",
    copy: "Subtle body copy looks refined, but some pairings are close to failing comfortable contrast.",
  },
  {
    category: "Interaction",
    title: "The next best step is not explicit",
    copy: "Users can act, but the interface does not strongly guide the preferred path forward.",
  },
];

const systemSteps = [
  "Upload screenshot",
  "Route through Next.js API",
  "Analyze with Ollama",
  "Persist with Supabase",
  "Render structured report",
];

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-18 pt-10 sm:px-10 lg:px-12 lg:pb-24 lg:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="surface-card overflow-hidden p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="app-chip">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
                Google-inspired Material refresh
              </span>
              <span className="status-badge status-badge-neutral">
                Portfolio-ready UX critique
              </span>
            </div>

            <div className="mt-8 space-y-5">
              <h1 className="max-w-4xl text-5xl leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Review interface screenshots with a calm, structured Google-style flow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                AI Interface Critic turns a single UI screenshot into a readable
                UX review covering visual hierarchy, accessibility, interaction
                clarity, and layout quality.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/upload">Start analysis</ButtonLink>
              <ButtonLink href="/#workflow" variant="secondary">
                See the workflow
              </ButtonLink>
              <ButtonLink href="/report/demo" variant="text">
                Open demo report
              </ButtonLink>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {productPillars.map((pillar) => (
                <article key={pillar.title} className="surface-muted p-5">
                  <p className="eyebrow text-[var(--color-accent)]">{pillar.label}</p>
                  <h2 className="mt-3 text-xl leading-7">{pillar.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {pillar.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="surface-tonal p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Preview</p>
                <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
                  Clear report framing before the first prompt ever appears.
                </h2>
              </div>
              <span className="status-badge status-badge-success">Report ready</span>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="metric-card grid gap-4 p-5 sm:grid-cols-[0.7fr_1fr]">
                <div>
                  <p className="eyebrow">Overall score</p>
                  <p className="mt-3 text-6xl font-medium tracking-tight text-[var(--color-accent)]">
                    78
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    A strong baseline with noticeable room to improve first-scan emphasis.
                  </p>
                </div>
                <div className="surface-muted p-4">
                  <p className="eyebrow">Main finding</p>
                  <p className="mt-3 text-base leading-7">
                    The primary CTA loses emphasis because nearby elements compete
                    for the same visual weight.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {sampleIssues.map((issue, index) => (
                  <article key={issue.title} className="metric-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="status-badge status-badge-neutral">
                        {issue.category}
                      </span>
                      <span
                        className={`status-badge ${
                          index === 0
                            ? "status-badge-primary"
                            : index === 1
                              ? "status-badge-warning"
                              : "status-badge-success"
                        }`}
                      >
                        {index === 0 ? "High impact" : "Medium impact"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg leading-7">{issue.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      {issue.copy}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="workflow" className="grid gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2 className="mt-3 text-4xl tracking-tight sm:text-5xl">
                One clear loop from screenshot to critique.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              The MVP stays narrow on purpose. That is what keeps the product from
              collapsing into a generic AI demo.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article key={step.step} className="surface-card p-6">
                <p className="font-mono text-sm text-[var(--color-accent)]">{step.step}</p>
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
          className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"
        >
          <div className="surface-card p-8">
            <p className="eyebrow">Report structure</p>
            <h2 className="mt-3 text-4xl tracking-tight sm:text-5xl">
              The output looks like a product review, not a chat transcript.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-muted)]">
              Hiring managers and teammates need structured reasoning. The report
              page groups findings into stable categories with score, evidence,
              and a clear recommendation.
            </p>

            <div className="mt-8 grid gap-3">
              {reportSections.map((section) => (
                <article key={section.title} className="surface-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg">{section.title}</h3>
                    <span className={`status-badge ${section.tone}`}>Live section</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    {section.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {sampleIssues.map((issue, index) => (
                <article key={`${issue.category}-${issue.title}`} className="surface-muted p-5">
                  <span
                    className={`status-badge ${
                      index === 0
                        ? "status-badge-primary"
                        : index === 1
                          ? "status-badge-warning"
                          : "status-badge-success"
                    }`}
                  >
                    {issue.category}
                  </span>
                  <h3 className="mt-4 text-lg leading-7">{issue.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {issue.copy}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[var(--color-foreground)]">
                    Suggestion: increase contrast for the main action and reduce
                    competing emphasis around it.
                  </p>
                </article>
              ))}

              <article className="surface-tonal flex flex-col justify-between p-5">
                <div>
                  <p className="eyebrow">Loading experience</p>
                  <h3 className="mt-4 text-2xl tracking-tight">
                    Explain what the AI is checking while the model works.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    Analyzing visual hierarchy, checking accessibility, and evaluating
                    layout structure makes the delay feel intentional.
                  </p>
                </div>
                <ButtonLink href="/loading" variant="text" className="mt-5 w-fit px-0">
                  Preview loading state
                </ButtonLink>
              </article>
            </div>
          </div>
        </section>

        <section id="system" className="surface-card p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">System</p>
              <h2 className="mt-3 text-4xl tracking-tight sm:text-5xl">
                Problem, UX, system, and code stay connected.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              The stack stays intentionally simple: Next.js App Router, Tailwind,
              Ollama for analysis, and Supabase for auth, storage, and persistence.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <article className="surface-muted p-5">
              <p className="eyebrow text-[var(--color-accent)]">User</p>
              <p className="mt-3 text-lg">Junior designers</p>
            </article>
            <article className="surface-muted p-5">
              <p className="eyebrow text-[var(--color-accent)]">Frontend</p>
              <p className="mt-3 text-lg">Next.js App Router + Tailwind</p>
            </article>
            <article className="surface-muted p-5">
              <p className="eyebrow text-[var(--color-accent)]">AI</p>
              <p className="mt-3 text-lg">Local Ollama screenshot analysis</p>
            </article>
            <article className="surface-muted p-5">
              <p className="eyebrow text-[var(--color-accent)]">Platform</p>
              <p className="mt-3 text-lg">Supabase auth, storage, history</p>
            </article>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            {systemSteps.map((step) => (
              <div key={step} className="surface-muted p-4 text-sm text-[var(--color-muted)]">
                {step}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
