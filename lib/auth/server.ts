import { createAuthServer, neonAuth } from "@neondatabase/auth/next/server";

import { hasNeonAuthConfig } from "@/lib/env";

export async function getCurrentAuthSession() {
  if (!hasNeonAuthConfig()) {
    return { session: null, user: null };
  }

  try {
    return await neonAuth();
  } catch (error) {
    console.error("Neon auth session lookup failed.", error);
    return { session: null, user: null };
  }
}

export function getAuthServer() {
  if (!hasNeonAuthConfig()) {
    return null;
  }

  return createAuthServer();
}
