"use client";

import { SignInTrigger } from "@/components/auth/sign-in-modal";
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
        Sign in
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
    <SignInTrigger className="material-button material-button-secondary">
      Sign in
    </SignInTrigger>
  );
}

export function HomeStatusAuthAction() {
  return (
    <ButtonLink href="/history" variant="text">
      Open history
    </ButtonLink>
  );
}
