import Link from "next/link";

const navItems = [
  { href: "/#workflow", label: "Workflow" },
  { href: "/#report-preview", label: "Report" },
  { href: "/#system", label: "System" },
  { href: "/history", label: "History" },
  { href: "/auth/sign-in", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[conic-gradient(from_180deg,_#4285f4,_#34a853,_#fbbc04,_#ea4335,_#4285f4)] p-[1px] shadow-sm">
            <span className="flex h-full w-full items-center justify-center rounded-[calc(1rem-1px)] bg-white text-sm font-medium text-[var(--color-accent)]">
              AI
            </span>
          </span>
          <div>
            <p className="eyebrow">
              AI Interface Critic
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Structured screenshot critique
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[var(--color-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-white hover:text-[var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="material-button material-button-secondary hidden sm:inline-flex"
          >
            History
          </Link>
          <Link
            href="/upload"
            className="material-button material-button-primary"
          >
            Start analysis
          </Link>
        </div>
      </div>
    </header>
  );
}
