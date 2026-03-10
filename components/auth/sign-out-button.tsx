"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignOutButton({
  className = "",
  onSignedOut,
}: {
  className?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    try {
      setIsPending(true);
      await authClient.signOut();
      onSignedOut?.();
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={isPending}
      className={`material-button material-button-secondary disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
