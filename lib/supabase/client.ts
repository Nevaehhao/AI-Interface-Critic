import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv, getSupabasePublicKey } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const clientEnv = getClientEnv();
  const supabaseKey = getSupabasePublicKey();

  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    return null;
  }

  return createBrowserClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);
}
