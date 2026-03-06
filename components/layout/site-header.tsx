import Link from "next/link";

const navItems = [
  { href: "#workflow", label: "Workflow" },
  { href: "#report-preview", label: "Report Preview" },
  { href: "#system", label: "System" },
  { href: "/history", label: "History" },
  { href: "/auth/sign-in", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(11,16,32,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-mono text-sm text-[var(--color-accent)]">
            AIC
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
              AI Interface Critic
            </p>
            <p className="text-sm text-white/80">Structured screenshot critique</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--color-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="hidden items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 sm:inline-flex"
          >
            History
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Start analysis
          </Link>
        </div>
      </div>
    </header>
  );
}
