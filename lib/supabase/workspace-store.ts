import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  user_id: string;
};

export async function listWorkspaces() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { user: null, workspaces: null as WorkspaceRecord[] | null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, workspaces: [] as WorkspaceRecord[] };
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, description, accent_color, created_at, updated_at, user_id")
    .order("created_at", { ascending: true });

  if (error) {
    return { user, workspaces: [] as WorkspaceRecord[] };
  }

  return {
    user,
    workspaces: (data ?? []) as WorkspaceRecord[],
  };
}

export async function createWorkspace(input: WorkspaceInput) {
  const parsedInput = workspaceInputSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase env is missing. Add project credentials to enable workspaces.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in before creating a workspace.");
  }

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      description: parsedInput.description?.trim() || null,
      name: parsedInput.name.trim(),
      user_id: user.id,
    })
    .select("id, name, description, accent_color, created_at, updated_at, user_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create workspace.");
  }

  return data as WorkspaceRecord;
}
