import { neon } from "@neondatabase/serverless";

import { getServerEnv, hasDatabaseConfig } from "@/lib/env";

type DbClient = ReturnType<typeof neon>;

type LegacySchemaStatusRow = {
  analyses_exists: boolean;
  analyses_has_share_enabled: boolean;
  analyses_has_share_token: boolean;
  analyses_has_workspace_id: boolean;
  workspaces_exists: boolean;
  workspaces_has_archived_at: boolean;
  workspaces_has_tags: boolean;
};

let sqlClient: DbClient | null = null;
let schemaEnsurePromise: Promise<void> | null = null;

async function ensureLegacySchemaCompatibility(sql: DbClient) {
  const [status] = (await sql`
    select
      exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'analyses'
      ) as analyses_exists,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'analyses'
          and column_name = 'share_enabled'
      ) as analyses_has_share_enabled,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'analyses'
          and column_name = 'share_token'
      ) as analyses_has_share_token,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'analyses'
          and column_name = 'workspace_id'
      ) as analyses_has_workspace_id,
      exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'workspaces'
      ) as workspaces_exists,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'workspaces'
          and column_name = 'archived_at'
      ) as workspaces_has_archived_at,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'workspaces'
          and column_name = 'tags'
      ) as workspaces_has_tags
  `) as LegacySchemaStatusRow[];

  if (!status) {
    return;
  }

  const statements: string[] = [];

  if (status.workspaces_exists) {
    if (!status.workspaces_has_tags) {
      statements.push(
        "alter table workspaces add column if not exists tags text[] not null default '{}'",
      );
    }

    if (!status.workspaces_has_archived_at) {
      statements.push(
        "alter table workspaces add column if not exists archived_at timestamptz",
      );
    }
  }

  if (status.analyses_exists) {
    if (!status.analyses_has_workspace_id && status.workspaces_exists) {
      statements.push(
        "alter table analyses add column if not exists workspace_id uuid references workspaces(id) on delete set null",
      );
    }

    if (!status.analyses_has_share_enabled) {
      statements.push(
        "alter table analyses add column if not exists share_enabled boolean not null default false",
      );
    }

    if (!status.analyses_has_share_token) {
      statements.push(
        "alter table analyses add column if not exists share_token text unique",
      );
    }
  }

  for (const statement of statements) {
    await sql.query(statement);
  }
}

export function getDb() {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(getServerEnv().DATABASE_URL!);
  }

  return sqlClient;
}

export async function getDbWithSchema() {
  const sql = getDb();

  if (!sql) {
    return null;
  }

  if (!schemaEnsurePromise) {
    schemaEnsurePromise = ensureLegacySchemaCompatibility(sql).catch((error) => {
      schemaEnsurePromise = null;
      throw error;
    });
  }

  await schemaEnsurePromise;

  return sql;
}
