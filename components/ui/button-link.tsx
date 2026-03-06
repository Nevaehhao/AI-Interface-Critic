import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "text";
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
        "material-button",
        variant === "primary"
          ? "material-button-primary"
          : variant === "secondary"
            ? "material-button-secondary"
            : "material-button-text",
        className,
      )}
    >
      {children}
    </Link>
  );
}
