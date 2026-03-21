"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth/client";
import { getUserProfileInitials, getUserProfileName } from "@/lib/auth/user-profile";

const navItems = [
  { href: "/upload", label: "Upload" },
  { href: "/history", label: "History" },
  { href: "/workspaces", label: "Workspaces" },
  { href: "/setup", label: "Setup" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: sessionData, isPending } = authClient.useSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const user = sessionData?.user ?? null;
  const isSignedIn = Boolean(user);
  const userName = getUserProfileName(user);
  const userInitials = getUserProfileInitials(user);

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedAccountMenu = accountMenuRef.current?.contains(target);
      const clickedMobileMenu = mobileMenuRef.current?.contains(target);

      if (!clickedAccountMenu && !clickedMobileMenu) {
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
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[rgba(247,247,245,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.86)] text-sm font-semibold text-[var(--color-foreground)]">
            AC
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
              AI Interface Critic
            </p>
            <p className="hidden truncate text-xs text-[var(--color-muted)] sm:block">
              Critique. Handoff. Build.
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 text-sm text-[var(--color-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 transition hover:bg-[rgba(255,255,255,0.86)] hover:text-[var(--color-foreground)] ${
                isActivePath(pathname, item.href)
                  ? "bg-[rgba(255,255,255,0.92)] text-[var(--color-foreground)]"
                  : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/upload" className="material-button material-button-secondary px-4">
            <span className="hidden sm:inline">New run</span>
            <span className="sm:hidden">Run</span>
          </Link>

          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open navigation menu"
              className="material-button material-button-secondary px-4"
            >
              Menu
            </button>

            {isMobileMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+12px)] w-[min(22rem,calc(100vw-3rem))] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.96)] p-5 shadow-[0_24px_60px_rgba(17,17,17,0.12)] backdrop-blur-xl"
              >
                <div className="grid gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] ${
                        isActivePath(pathname, item.href) ? "border-[var(--color-accent)]" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                  {isPending ? (
                    <p className="text-sm leading-7 text-[var(--color-muted)]">Checking account…</p>
                  ) : isSignedIn ? (
                    <>
                      <p className="eyebrow text-[var(--color-foreground)]">Account</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                        {userName}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                        {user?.email ?? "Signed in"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="eyebrow text-[var(--color-foreground)]">Account</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        Sign in to sync reports, workspaces, and share links across sessions.
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-5">
                  {isPending ? (
                    <div
                      aria-hidden="true"
                      className="h-11 w-full animate-pulse rounded-full border border-[var(--color-line)] bg-white"
                    />
                  ) : isSignedIn ? (
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

          <div className="hidden md:block">
            {isPending ? (
              <div
                aria-hidden="true"
                className="h-11 w-11 animate-pulse rounded-full border border-[var(--color-line)] bg-white"
              />
            ) : isSignedIn ? (
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.88)] text-sm font-semibold text-[var(--color-foreground)] shadow-[0_8px_20px_rgba(17,17,17,0.06)] transition hover:border-[rgba(17,17,17,0.12)] hover:shadow-[0_12px_24px_rgba(17,17,17,0.09)]"
                >
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={`${userName} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </button>

                {isAccountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+12px)] w-[18.5rem] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_24px_60px_rgba(17,17,17,0.12)] backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-soft)] text-base font-semibold text-[var(--color-foreground)]">
                        {user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt={`${userName} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          userInitials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                          {userName}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {user?.email ?? "Signed in"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                      <p className="eyebrow text-[var(--color-foreground)]">Account</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        Signed in with Neon Auth. Open your history or workspace to continue this
                        review flow.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-2">
                      <Link
                        href="/history"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:border-[var(--color-accent)]"
                      >
                        View history
                      </Link>
                      <Link
                        href="/workspaces"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:border-[var(--color-accent)]"
                      >
                        Open workspaces
                      </Link>
                      <Link
                        href="/setup"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="surface-muted rounded-[1rem] px-4 py-3 text-sm text-[var(--color-foreground)] transition hover:border-[var(--color-accent)]"
                      >
                        Check setup
                      </Link>
                    </div>

                    <div className="mt-5 border-t border-[var(--color-line)] pt-4">
                      <SignOutButton
                        className="w-full justify-center"
                        onSignedOut={() => setIsAccountMenuOpen(false)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/auth/sign-in" className="material-button material-button-secondary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
