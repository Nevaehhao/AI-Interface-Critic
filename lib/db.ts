import { neon } from "@neondatabase/serverless";

import { getServerEnv, hasDatabaseConfig } from "@/lib/env";

let sqlClient: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(getServerEnv().DATABASE_URL!);
  }

  return sqlClient;
}
