import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

export function ButtonLink({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition",
        variant === "primary"
          ? "bg-[var(--color-accent)] text-slate-950 hover:bg-[#ff9d57]"
          : "border border-[var(--color-line)] bg-white/5 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
