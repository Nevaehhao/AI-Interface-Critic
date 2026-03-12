import { z } from "zod";

import { getCurrentAuthSession } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

const workspaceTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .transform((value) => value.toLowerCase());

export const workspaceInputSchema = z.object({
  accentColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .optional()
    .nullable(),
  description: z.string().trim().max(280).optional().nullable(),
  name: z.string().trim().min(1).max(80),
  tags: z.array(workspaceTagSchema).max(8).default([]),
});

export type WorkspaceInput = z.infer<typeof workspaceInputSchema>;

export type WorkspaceRecord = {
  accent_color: string | null;
  archived_at: string | null;
  created_at: string;
  description: string | null;
  id: string;
  name: string;
  tags: string[];
  updated_at: string;
  auth_user_id: string;
};

async function requireWorkspaceAccess() {
  if (!hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return { sql: null, user: null as Awaited<ReturnType<typeof getCurrentAuthSession>>["user"] };
  }

  const sql = getDb();

  if (!sql) {
    return { sql: null, user: null as Awaited<ReturnType<typeof getCurrentAuthSession>>["user"] };
  }

  const { user } = await getCurrentAuthSession();

  return {
    sql,
    user,
  };
}

export async function listWorkspaces(options?: {
  includeArchived?: boolean;
}) {
  const { sql, user } = await requireWorkspaceAccess();

  if (!sql) {
    return { user: null, workspaces: null as WorkspaceRecord[] | null };
  }

  if (!user) {
    return { user: null, workspaces: [] as WorkspaceRecord[] };
  }

  const workspaces = options?.includeArchived
    ? ((await sql`
        select
          id,
          name,
          description,
          accent_color,
          tags,
          archived_at,
          created_at,
          updated_at,
          auth_user_id
        from workspaces
        where auth_user_id = ${user.id}
        order by created_at asc
      `) as WorkspaceRecord[])
    : ((await sql`
        select
          id,
          name,
          description,
          accent_color,
          tags,
          archived_at,
          created_at,
          updated_at,
          auth_user_id
        from workspaces
        where auth_user_id = ${user.id}
          and archived_at is null
        order by created_at asc
      `) as WorkspaceRecord[]);

  return {
    user,
    workspaces,
  };
}

export async function createWorkspace(input: WorkspaceInput) {
  const parsedInput = workspaceInputSchema.parse(input);
  const { sql, user } = await requireWorkspaceAccess();

  if (!sql) {
    throw new Error("Database env is missing. Add Neon credentials to enable workspaces.");
  }

  if (!user) {
    throw new Error("Sign in before creating a workspace.");
  }

  const [workspace] = (await sql`
    insert into workspaces (
      auth_user_id,
      name,
      description,
      accent_color,
      tags
    )
    values (
      ${user.id},
      ${parsedInput.name.trim()},
      ${parsedInput.description?.trim() || null},
      ${parsedInput.accentColor?.trim() || null},
      ${parsedInput.tags}
    )
    returning
      id,
      name,
      description,
      accent_color,
      tags,
      archived_at,
      created_at,
      updated_at,
      auth_user_id
  `) as WorkspaceRecord[];

  if (!workspace) {
    throw new Error("Unable to create workspace.");
  }

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  input: WorkspaceInput,
) {
  const parsedInput = workspaceInputSchema.parse(input);
  const { sql, user } = await requireWorkspaceAccess();

  if (!sql) {
    throw new Error("Database env is missing. Add Neon credentials to enable workspaces.");
  }

  if (!user) {
    throw new Error("Sign in before updating a workspace.");
  }

  const [workspace] = (await sql`
    update workspaces
    set
      name = ${parsedInput.name.trim()},
      description = ${parsedInput.description?.trim() || null},
      accent_color = ${parsedInput.accentColor?.trim() || null},
      tags = ${parsedInput.tags},
      updated_at = now()
    where id = ${workspaceId}::uuid
      and auth_user_id = ${user.id}
    returning
      id,
      name,
      description,
      accent_color,
      tags,
      archived_at,
      created_at,
      updated_at,
      auth_user_id
  `) as WorkspaceRecord[];

  if (!workspace) {
    throw new Error("Unable to update workspace.");
  }

  return workspace;
}

export async function setWorkspaceArchived(
  workspaceId: string,
  archived: boolean,
) {
  const { sql, user } = await requireWorkspaceAccess();

  if (!sql) {
    throw new Error("Database env is missing. Add Neon credentials to enable workspaces.");
  }

  if (!user) {
    throw new Error("Sign in before archiving a workspace.");
  }

  const [workspace] = (await sql`
    update workspaces
    set
      archived_at = ${archived ? new Date().toISOString() : null}::timestamptz,
      updated_at = now()
    where id = ${workspaceId}::uuid
      and auth_user_id = ${user.id}
    returning
      id,
      name,
      description,
      accent_color,
      tags,
      archived_at,
      created_at,
      updated_at,
      auth_user_id
  `) as WorkspaceRecord[];

  if (!workspace) {
    throw new Error("Unable to update workspace archive state.");
  }

  return workspace;
}

export async function deleteWorkspace(workspaceId: string) {
  const { sql, user } = await requireWorkspaceAccess();

  if (!sql) {
    throw new Error("Database env is missing. Add Neon credentials to enable workspaces.");
  }

  if (!user) {
    throw new Error("Sign in before deleting a workspace.");
  }

  const [workspace] = (await sql`
    delete from workspaces
    where id = ${workspaceId}::uuid
      and auth_user_id = ${user.id}
    returning
      id
  `) as Array<{ id: string }>;

  if (!workspace) {
    throw new Error("Unable to delete workspace.");
  }

  return workspace;
}
