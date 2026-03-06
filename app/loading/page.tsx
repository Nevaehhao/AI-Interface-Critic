import { AnalysisLoadingView } from "@/components/loading/analysis-loading-view";

export default function LoadingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,143,61,0.15),_transparent_32%),var(--color-surface)] px-6 py-16 text-[var(--color-foreground)] sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <AnalysisLoadingView />
      </div>
    </main>
  );
}
