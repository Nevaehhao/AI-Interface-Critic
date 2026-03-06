import Link from "next/link";

import type { AnalysisReport, AnalysisSection } from "@/lib/analysis-report";
import { ReportScreenshotPreview } from "@/components/report/report-screenshot-preview";

function scoreTone(score: number) {
  if (score >= 85) {
    return "text-emerald-200 border-emerald-400/20 bg-emerald-400/10";
  }

  if (score >= 70) {
    return "text-amber-100 border-amber-400/20 bg-amber-400/10";
  }

  return "text-rose-100 border-rose-400/20 bg-rose-400/10";
}

function SectionCard({ section }: { section: AnalysisSection }) {
  return (
    <section
      id={section.id}
      className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Section
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            {section.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            {section.summary}
          </p>
        </div>

        <div className={`rounded-full border px-4 py-2 text-sm ${scoreTone(section.score)}`}>
          Score {section.score}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {section.issues.map((issue) => (
          <article
            key={issue.id}
            className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  {section.title}
                </p>
                <h3 className="mt-3 text-xl tracking-tight">{issue.title}</h3>
              </div>
              <span className="rounded-full border border-white/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {issue.severity} impact
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {issue.description}
            </p>

            <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Recommendation
              </p>
              <p className="mt-2 text-sm leading-7 text-white/90">
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
}: {
  analysisId: string;
  report: AnalysisReport;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.16),_transparent_32%),linear-gradient(180deg,#0b1020_0%,#090d18_54%,#070b14_100%)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <Link href="/upload" className="text-sm text-[var(--color-muted)] underline-offset-4 hover:underline">
          Back to upload
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Analysis {analysisId}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-200">
                Mock report
              </span>
            </div>

            <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
              Structured UX critique for a {report.summary.productType}.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
              {report.summary.mainFinding}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-[0.65fr_1fr]">
              <div className="rounded-[1.75rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Overall score
                </p>
                <p className="mt-3 text-6xl font-semibold text-white">
                  {report.summary.overallScore}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  A strong baseline with clear room to improve hierarchy and
                  readability.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/8 bg-[#090d18] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Strong signals
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/90">
                  {report.summary.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Next action
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/90">
                    {report.summary.nextAction}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-[2rem] border border-[var(--color-line)] bg-white/5 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                Screenshot context
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight">
                Input and section map
              </h2>
            </div>

            <ReportScreenshotPreview />

            <div className="rounded-[1.5rem] border border-white/8 bg-[#090d18] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Jump to section
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-full border border-white/8 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
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
      </div>
    </main>
  );
}
