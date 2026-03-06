import { z } from "zod";

import { getCurrentAuthSession } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";

export const workspaceInputSchema = z.object({
  description: z.string().trim().max(280).optional().nullable(),
  name: z.string().trim().min(1).max(80),
});

export type WorkspaceInput = z.infer<typeof workspaceInputSchema>;

export type WorkspaceRecord = {
  accent_color: string | null;
  created_at: string;
  description: string | null;
  id: string;
  name: string;
  updated_at: string;
  auth_user_id: string;
};

export async function listWorkspaces() {
  if (!hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return { user: null, workspaces: null as WorkspaceRecord[] | null };
  }

  const sql = getDb();

  if (!sql) {
    return { user: null, workspaces: null as WorkspaceRecord[] | null };
  }

  const { user } = await getCurrentAuthSession();

  if (!user) {
    return { user: null, workspaces: [] as WorkspaceRecord[] };
  }

  const workspaces = (await sql`
    select
      id,
      name,
      description,
      accent_color,
      created_at,
      updated_at,
      auth_user_id
    from workspaces
    where auth_user_id = ${user.id}
    order by created_at asc
  `) as WorkspaceRecord[];

  return {
    user,
    workspaces,
  };
}

export async function createWorkspace(input: WorkspaceInput) {
  const parsedInput = workspaceInputSchema.parse(input);
  const sql = getDb();

  if (!sql) {
    throw new Error("Database env is missing. Add Neon credentials to enable workspaces.");
  }

  const { user } = await getCurrentAuthSession();

  if (!user) {
    throw new Error("Sign in before creating a workspace.");
  }

  const [workspace] = (await sql`
    insert into workspaces (
      auth_user_id,
      name,
      description
    )
    values (
      ${user.id},
      ${parsedInput.name.trim()},
      ${parsedInput.description?.trim() || null}
    )
    returning
      id,
      name,
      description,
      accent_color,
      created_at,
      updated_at,
      auth_user_id
  `) as WorkspaceRecord[];

  if (!workspace) {
    throw new Error("Unable to create workspace.");
  }

  return workspace;
}
