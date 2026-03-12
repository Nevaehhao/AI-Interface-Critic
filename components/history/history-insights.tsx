import type { AnalysisReport } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";

export type HistoryAnalysisEntry = {
  createdAt: string;
  id: string;
  isLocal: boolean;
  mainFinding: string;
  nextAction: string;
  overallScore: number;
  productType: string;
  report: AnalysisReport;
  screenshotUrl: string | null;
  shareEnabled?: boolean;
  source: AnalysisSource;
  workspaceId: string | null;
  workspaceName: string | null;
};

function normalizeIssueKey(title: string) {
  return title.trim().toLowerCase();
}

function getIssueKeys(report: AnalysisReport) {
  return report.sections.flatMap((section) =>
    section.issues.map((issue) => normalizeIssueKey(issue.title)),
  );
}

function getRecurringIssueTitles(entries: HistoryAnalysisEntry[]) {
  const counts = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const entry of entries) {
    for (const section of entry.report.sections) {
      for (const issue of section.issues) {
        const issueKey = normalizeIssueKey(issue.title);

        labels.set(issueKey, labels.get(issueKey) ?? issue.title);
        counts.set(issueKey, (counts.get(issueKey) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([issueKey, count]) => [labels.get(issueKey) ?? issueKey, count] as const);
}

function getResolvedAndNewIssues(entries: HistoryAnalysisEntry[]) {
  const [before, after] = entries;
  const beforeIssues = new Map<string, string>();
  const afterIssues = new Map<string, string>();

  for (const section of before.report.sections) {
    for (const issue of section.issues) {
      beforeIssues.set(normalizeIssueKey(issue.title), issue.title);
    }
  }

  for (const section of after.report.sections) {
    for (const issue of section.issues) {
      afterIssues.set(normalizeIssueKey(issue.title), issue.title);
    }
  }

  return {
    newIssues: [...afterIssues.entries()]
      .filter(([issueKey]) => !beforeIssues.has(issueKey))
      .map(([, title]) => title),
    resolvedIssues: [...beforeIssues.entries()]
      .filter(([issueKey]) => !afterIssues.has(issueKey))
      .map(([, title]) => title),
  };
}

function buildSparklinePoints(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;

      return `${x},${y}`;
    })
    .join(" ");
}

export function TrendSparkline({
  entries,
}: {
  entries: HistoryAnalysisEntry[];
}) {
  const trendEntries = [...entries]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-12);
  const values = trendEntries.map((entry) => entry.overallScore);

  if (values.length < 2) {
    return (
      <div className="surface-muted p-5">
        <p className="eyebrow">Trend</p>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
          Add more analyses to see score movement over time.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-muted p-5">
      <p className="eyebrow">Trend</p>
      <div className="mt-4">
        <svg viewBox="0 0 100 100" className="h-24 w-full">
          <polyline
            fill="none"
            points={buildSparklinePoints(values)}
            stroke="var(--color-accent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        Latest {trendEntries.length} reports. Current range: {Math.min(...values)} to {Math.max(...values)}.
      </p>
    </div>
  );
}

export function HistoryComparePanel({
  entries,
}: {
  entries: HistoryAnalysisEntry[];
}) {
  if (entries.length !== 2) {
    return null;
  }

  const [before, after] = [...entries].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const { newIssues, resolvedIssues } = getResolvedAndNewIssues([before, after]);
  const sectionDeltas = after.report.sections.map((section) => {
    const beforeSection = before.report.sections.find((candidate) => candidate.id === section.id);

    return {
      delta: section.score - (beforeSection?.score ?? section.score),
      title: section.title,
    };
  });

  return (
    <section className="surface-card p-6 sm:p-8">
      <p className="eyebrow">Before / after</p>
      <h2 className="mt-4 text-3xl tracking-tight">Two selected reports compared.</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-muted p-5">
          <p className="eyebrow">Score delta</p>
          <p className="mt-3 text-4xl tracking-tight">
            {after.overallScore - before.overallScore >= 0 ? "+" : ""}
            {after.overallScore - before.overallScore}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {before.productType} to {after.productType}
          </p>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Resolved issues</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
            {resolvedIssues.length > 0 ? (
              resolvedIssues.map((issue) => <li key={issue}>{issue}</li>)
            ) : (
              <li>No issue titles disappeared between the two reports.</li>
            )}
          </ul>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">New issues</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
            {newIssues.length > 0 ? (
              newIssues.map((issue) => <li key={issue}>{issue}</li>)
            ) : (
              <li>No new issue titles appeared between the two reports.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {sectionDeltas.map((section) => (
          <div key={section.title} className="surface-muted p-5">
            <p className="eyebrow">{section.title}</p>
            <p className="mt-3 text-2xl tracking-tight">
              {section.delta >= 0 ? "+" : ""}
              {section.delta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HistoryFlowPanel({
  entries,
}: {
  entries: HistoryAnalysisEntry[];
}) {
  if (entries.length < 2) {
    return null;
  }

  const orderedEntries = [...entries].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const averageScore = Math.round(
    orderedEntries.reduce((sum, entry) => sum + entry.overallScore, 0) /
      orderedEntries.length,
  );
  const recurringIssues = getRecurringIssueTitles(orderedEntries);
  const weakestEntry = [...orderedEntries].sort(
    (left, right) => left.overallScore - right.overallScore,
  )[0];

  return (
    <section className="surface-card p-6 sm:p-8">
      <p className="eyebrow">Flow review</p>
      <h2 className="mt-4 text-3xl tracking-tight">Multi-screen pattern scan.</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-muted p-5">
          <p className="eyebrow">Screens selected</p>
          <p className="mt-3 text-4xl tracking-tight">{orderedEntries.length}</p>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Average score</p>
          <p className="mt-3 text-4xl tracking-tight">{averageScore}</p>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Weakest screen</p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {weakestEntry?.mainFinding ?? "No selection"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-muted p-5">
          <p className="eyebrow">Sequence</p>
          <div className="mt-4 space-y-3">
            {orderedEntries.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Screen {index + 1}</p>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {entry.mainFinding}
                  </p>
                </div>
                <span className="app-chip">Score {entry.overallScore}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="surface-muted p-5">
          <p className="eyebrow">Recurring issues</p>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
            {recurringIssues.length > 0 ? (
              recurringIssues.map(([issue, count]) => (
                <li key={issue}>
                  {issue} ({count} screens)
                </li>
              ))
            ) : (
              <li>No recurring issue titles across the selected screens.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
