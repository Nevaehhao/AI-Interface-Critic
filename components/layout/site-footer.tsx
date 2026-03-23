import Link from "next/link";

const footerLinks = [
  { href: "/history", label: "History" },
  { href: "/workspaces", label: "Workspaces" },
  { href: "/setup", label: "Setup" },
  { href: "/report/demo", label: "Demo Report" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/40 bg-[rgba(250,249,252,0.84)] px-6 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-[-0.04em] text-[var(--color-accent)]">
            UXCritic
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
            The Digital Curator for UI reviews, critique archives, and implementation handoff.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
