import Link from "next/link";

const navItems = [
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
  { href: "/setup", label: "Setup" },
  { href: "/auth/sign-in", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white text-sm font-semibold text-[var(--color-accent)]">
            AI
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-[var(--color-foreground)]">AI Interface Critic</p>
            <p className="text-xs text-[var(--color-muted)]">Upload. Analyze. Review.</p>
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
          <Link href="/history" className="material-button material-button-secondary hidden sm:inline-flex">
            History
          </Link>
          <Link href="/upload" className="material-button material-button-primary">
            Upload screenshot
          </Link>
        </div>
      </div>
    </header>
  );
}
