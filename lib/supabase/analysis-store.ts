import type { AnalysisReport } from "@/lib/analysis-report";
import { analysisReportSchema } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";

type PersistAnalysisInput = {
  file: File;
  report: AnalysisReport;
  source: AnalysisSource;
  userId: string | null;
  workspaceId?: string | null;
};

export type StoredAnalysisRow = {
  id: string;
  created_at: string;
  main_finding: string;
  overall_score: number;
  product_type: string;
  report: AnalysisReport;
  screenshot_url: string | null;
  source: AnalysisSource;
  user_id: string | null;
  workspace_id: string | null;
};

export type PersistedAnalysisRecord = {
  report: AnalysisReport;
  screenshotUrl: string | null;
  source: AnalysisSource;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export async function persistAnalysis({
  file,
  report,
  source,
  userId,
  workspaceId = null,
}: PersistAnalysisInput) {
  if (!userId) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    return null;
  }

  const storageBucket = getServerEnv().SUPABASE_STORAGE_BUCKET;
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const sanitizedName = sanitizeFileName(file.name);
  const storagePath = `${userId ?? "anonymous"}/${report.id}-${sanitizedName || `screenshot.${extension}`}`;

  const uploadResult = await supabaseAdmin.storage
    .from(storageBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(storageBucket).getPublicUrl(storagePath);

  const insertResult = await supabaseAdmin.from("analyses").upsert({
    created_at: report.createdAt,
    id: report.id,
    main_finding: report.summary.mainFinding,
    overall_score: report.summary.overallScore,
    product_type: report.summary.productType,
    report,
    screenshot_url: publicUrl,
    source,
    user_id: userId,
    workspace_id: workspaceId,
  });

  if (insertResult.error) {
    throw insertResult.error;
  }

  return {
    id: report.id,
    screenshotUrl: publicUrl,
  };
}

export async function getPersistedAnalysisById(
  analysisId: string,
): Promise<PersistedAnalysisRecord | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("report, screenshot_url, source")
    .eq("id", analysisId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    report: analysisReportSchema.parse(data.report),
    screenshotUrl: data.screenshot_url,
    source: data.source,
  };
}

export async function listPersistedAnalyses(workspaceId?: string | null) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { analyses: null, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { analyses: [], user: null };
  }

  let query = supabase
    .from("analyses")
    .select(
      "id, created_at, main_finding, overall_score, product_type, report, screenshot_url, source, user_id, workspace_id",
    )
    .order("created_at", { ascending: false })
    .limit(24);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    return { analyses: [], user };
  }

  return {
    analyses: (data ?? []).map((analysis) => ({
      ...analysis,
      report: analysisReportSchema.parse(analysis.report),
    })) as StoredAnalysisRow[],
    user,
  };
}
