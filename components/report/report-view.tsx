import Link from "next/link";

import type { AnalysisReport, AnalysisSection } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";
import { SiteHeader } from "@/components/layout/site-header";
import { ReportScreenshotPreview } from "@/components/report/report-screenshot-preview";

function scoreTone(score: number) {
  if (score >= 85) {
    return "status-badge status-badge-success";
  }

  if (score >= 70) {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-error";
}

function severityTone(severity: string) {
  if (severity === "high") {
    return "status-badge status-badge-error";
  }

  if (severity === "medium") {
    return "status-badge status-badge-warning";
  }

  return "status-badge status-badge-neutral";
}

function SectionCard({ section }: { section: AnalysisSection }) {
  return (
    <section
      id={section.id}
      className="surface-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">
            Section
          </p>
          <h2 className="mt-3 text-3xl tracking-tight">
            {section.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            {section.summary}
          </p>
        </div>

        <div className={scoreTone(section.score)}>
          Score {section.score}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {section.issues.map((issue) => (
          <article
            key={issue.id}
            className="surface-muted p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="eyebrow text-[var(--color-accent)]">
                  {section.title}
                </p>
                <h3 className="mt-3 text-xl tracking-tight">{issue.title}</h3>
              </div>
              <span className={severityTone(issue.severity)}>
                {issue.severity} impact
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {issue.description}
            </p>

            <div className="mt-5 rounded-[1.25rem] bg-white p-4 shadow-sm">
              <p className="eyebrow">
                Recommendation
              </p>
              <p className="mt-2 text-sm leading-7">
                {issue.recommendation}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReportView({
  analysisId,
  report,
  screenshotUrl = null,
  source = "mock",
}: {
  analysisId: string;
  report: AnalysisReport;
  screenshotUrl?: string | null;
  source?: AnalysisSource;
}) {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <Link href="/upload" className="material-button material-button-text w-fit px-0">
          Back to upload
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="app-chip">Analysis {analysisId}</span>
              <span
                className={
                  source === "ollama"
                    ? "status-badge status-badge-primary"
                    : "status-badge status-badge-success"
                }
              >
                {source === "ollama" ? "Ollama analysis" : "Mock fallback"}
              </span>
              <span className="app-chip">
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="mt-5 text-4xl tracking-tight sm:text-5xl">
              Structured UX critique for a {report.summary.productType}.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              {report.summary.mainFinding}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-[0.62fr_1fr]">
              <div className="surface-tonal p-5">
                <p className="eyebrow">Overall score</p>
                <p className="mt-3 text-6xl font-medium tracking-tight text-[var(--color-accent)]">
                  {report.summary.overallScore}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  A concise signal for how strong the interface feels before reading the details.
                </p>
              </div>

              <div className="surface-muted p-5">
                <p className="eyebrow">Strong signals</p>
                <ul className="mt-4 space-y-3 text-sm leading-7">
                  {report.summary.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[1.25rem] bg-white p-4 shadow-sm">
                  <p className="eyebrow">Next action</p>
                  <p className="mt-2 text-sm leading-7">
                    {report.summary.nextAction}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="surface-tonal space-y-5 p-6">
            <div>
              <p className="eyebrow">Screenshot context</p>
              <h2 className="mt-3 text-3xl tracking-tight">
                Input and section map
              </h2>
            </div>

            <ReportScreenshotPreview fallbackImageUrl={screenshotUrl} />

            <div className="surface-card rounded-[1.5rem] p-5 shadow-none">
              <p className="eyebrow">Jump to section</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="material-button material-button-secondary px-4 py-2 text-sm"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <div className="grid gap-6">
          {report.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </main>
    </div>
  );
}
