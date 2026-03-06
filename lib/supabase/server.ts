import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnv, getSupabasePublicKey } from "@/lib/env";

export async function createSupabaseServerClient() {
  const clientEnv = getClientEnv();
  const supabaseKey = getSupabasePublicKey();

  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can't always write cookies; proxy handles refreshes.
        }
      },
    },
  });
}
