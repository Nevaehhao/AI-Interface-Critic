"use client";

import { authClient } from "@/lib/auth/client";
import { ButtonLink } from "@/components/ui/button-link";

export function HomeHeroAuthAction() {
  const { data: sessionData, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className="material-button material-button-secondary min-w-32 animate-pulse"
      >
        Account
      </span>
    );
  }

  if (sessionData?.user) {
    return (
      <ButtonLink href="/workspaces" variant="secondary">
        Workspace
      </ButtonLink>
    );
  }

  return (
    <ButtonLink href="/auth/sign-in" variant="secondary">
      Account
    </ButtonLink>
  );
}

export function HomeStatusAuthAction() {
  return (
    <ButtonLink href="/history" variant="text">
      Open history
    </ButtonLink>
  );
}
