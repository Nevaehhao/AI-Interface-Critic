"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth/client";
import { getUserProfileInitials, getUserProfileName } from "@/lib/auth/user-profile";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/workspaces", label: "Workspaces" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: sessionData, isPending } = authClient.useSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const user = sessionData?.user ?? null;
  const userName = getUserProfileName(user);
  const userInitials = getUserProfileInitials(user);

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !accountMenuRef.current?.contains(target) &&
        !mobileMenuRef.current?.contains(target)
      ) {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAccountMenuOpen, isMobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-[rgba(250,249,252,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-screen-2xl items-center justify-between gap-4 px-6 sm:px-8">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-[-0.04em] text-[var(--color-accent)]"
        >
          LuminaCritic
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--color-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-1 font-display font-semibold transition-colors ${
                isActivePath(pathname, item.href)
                  ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-b-2 border-transparent hover:text-[var(--color-accent)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/upload" className="material-button material-button-primary px-5 py-3 text-sm">
            Upload UI
          </Link>

          <div className="relative hidden md:block" ref={accountMenuRef}>
            {isPending ? (
              <div
                aria-hidden="true"
                className="h-11 w-11 animate-pulse rounded-xl bg-white/80 shadow-[0_12px_30px_rgba(111,78,156,0.08)]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="glass-panel flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-semibold text-[var(--color-accent)] shadow-[0_12px_30px_rgba(111,78,156,0.08)]"
              >
                {user ? userInitials : "Account"}
              </button>
            )}

            {isAccountMenuOpen ? (
              <div
                role="menu"
                className="glass-panel absolute right-0 top-[calc(100%+14px)] w-72 rounded-[1.5rem] border border-white/50 p-5 shadow-[0_24px_60px_rgba(111,78,156,0.16)]"
              >
                <div className="space-y-1">
                  <p className="eyebrow">Account</p>
                  <p className="font-display text-xl font-bold">
                    {user ? userName : "Sign in to sync"}
                  </p>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {user?.email ??
                      "Keep workspaces, share links, and report history available across sessions."}
                  </p>
                </div>

                <div className="mt-5 grid gap-2">
                  <Link
                    href="/history"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:bg-white"
                  >
                    View history
                  </Link>
                  <Link
                    href="/workspaces"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:bg-white"
                  >
                    Open workspaces
                  </Link>
                  <Link
                    href="/setup"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:bg-white"
                  >
                    Check setup
                  </Link>
                </div>

                <div className="mt-5">
                  {user ? (
                    <SignOutButton
                      className="w-full justify-center"
                      onSignedOut={() => setIsAccountMenuOpen(false)}
                    />
                  ) : (
                    <Link
                      href="/auth/sign-in"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="material-button material-button-secondary w-full"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open navigation menu"
              className="glass-panel flex h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--color-accent)] shadow-[0_12px_30px_rgba(111,78,156,0.08)]"
            >
              Menu
            </button>

            {isMobileMenuOpen ? (
              <div
                role="menu"
                className="glass-panel absolute right-0 top-[calc(100%+14px)] w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/50 p-5 shadow-[0_24px_60px_rgba(111,78,156,0.16)]"
              >
                <div className="grid gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`surface-muted rounded-[1rem] px-4 py-3 text-sm ${
                        isActivePath(pathname, item.href)
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-foreground)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/setup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)]"
                  >
                    Setup
                  </Link>
                </div>

                <div className="surface-muted mt-5 rounded-[1.25rem] p-4">
                  <p className="eyebrow">Account</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {user
                      ? user?.email ?? userName
                      : "Sign in to sync reports, workspaces, and share links across sessions."}
                  </p>
                </div>

                <div className="mt-5">
                  {user ? (
                    <SignOutButton
                      className="w-full justify-center"
                      onSignedOut={() => setIsMobileMenuOpen(false)}
                    />
                  ) : (
                    <Link
                      href="/auth/sign-in"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="material-button material-button-secondary w-full"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
