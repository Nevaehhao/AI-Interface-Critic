import { SignInModal } from "@/components/auth/sign-in-modal";
import { hasNeonAuthConfig } from "@/lib/env";

export default function SignInPage() {
  return (
    <main className="page-shell min-h-screen">
      <SignInModal
        closeHref="/"
        isConfigured={hasNeonAuthConfig()}
        isOpen
      />
    </main>
  );
}
