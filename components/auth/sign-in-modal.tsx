"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useState } from "react";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import { cn } from "@/lib/utils";

type SignInModalProps = {
  closeHref?: string;
  isConfigured?: boolean;
  isOpen: boolean;
  onClose?: () => void;
};

type SignInTriggerProps = {
  children: ReactNode;
  className?: string;
  isConfigured?: boolean;
  onOpen?: () => void;
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseControl({
  closeHref,
  onClose,
}: {
  closeHref?: string;
  onClose?: () => void;
}) {
  const className =
    "glass-panel flex h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--color-accent)] shadow-[0_12px_30px_rgba(111,78,156,0.08)]";

  if (closeHref) {
    return (
      <Link href={closeHref} aria-label="Close sign-in" className={className}>
        <CloseIcon />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label="Close sign-in"
      onClick={onClose}
      className={className}
    >
      <CloseIcon />
    </button>
  );
}

export function SignInModal({
  closeHref,
  isConfigured = true,
  isOpen,
  onClose,
}: SignInModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[rgba(244,240,249,0.78)] backdrop-blur-md" />
      {onClose ? (
        <button
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          className="absolute inset-0"
        />
      ) : null}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl pt-14"
      >
        <div className="absolute right-0 top-0 z-10">
          <CloseControl closeHref={closeHref} onClose={onClose} />
        </div>
        <h1 id={titleId} className="sr-only">
          Sign in
        </h1>
        <SignInPanel
          isConfigured={isConfigured}
          className={cn("max-h-[calc(100vh-5.5rem)] overflow-y-auto")}
        />
      </div>
    </div>
  );
}

export function SignInTrigger({
  children,
  className,
  isConfigured = true,
  onOpen,
}: SignInTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          setIsOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      <SignInModal
        isConfigured={isConfigured}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
