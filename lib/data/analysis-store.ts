import type { AnalysisReport } from "@/lib/analysis-report";
import { analysisReportSchema } from "@/lib/analysis-report";
import type { AnalysisSource } from "@/lib/analysis-result";
import { getCurrentAuthSession } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { hasDatabaseConfig, hasNeonAuthConfig } from "@/lib/env";
import { writeScreenshotToLocalStorage } from "@/lib/storage/local";

type PersistAnalysisInput = {
  file: File;
  report: AnalysisReport;
  source: AnalysisSource;
  userId: string | null;
  workspaceId?: string | null;
};

type AnalysisDbRow = {
  id: string;
  created_at: string;
  main_finding: string;
  overall_score: number;
  product_type: string;
  report: AnalysisReport | string;
  screenshot_key: string | null;
  source: AnalysisSource;
  auth_user_id: string | null;
  workspace_id: string | null;
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
  auth_user_id: string | null;
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

function parseStoredReport(rawReport: AnalysisDbRow["report"]) {
  return analysisReportSchema.parse(
    typeof rawReport === "string" ? JSON.parse(rawReport) : rawReport,
  );
}

function toStoredAnalysisRow(row: AnalysisDbRow): StoredAnalysisRow {
  return {
    auth_user_id: row.auth_user_id,
    created_at: row.created_at,
    id: row.id,
    main_finding: row.main_finding,
    overall_score: row.overall_score,
    product_type: row.product_type,
    report: parseStoredReport(row.report),
    screenshot_url: row.screenshot_key ? `/api/screenshots/${row.id}` : null,
    source: row.source,
    workspace_id: row.workspace_id,
  };
}

export async function persistAnalysis({
  file,
  report,
  source,
  userId,
  workspaceId = null,
}: PersistAnalysisInput) {
  if (!userId || !hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return null;
  }

  const sql = getDb();

  if (!sql) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const sanitizedName = sanitizeFileName(file.name);
  const screenshotKey = `${userId}/${report.id}-${sanitizedName || `screenshot.${extension}`}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await writeScreenshotToLocalStorage({
    body: fileBuffer,
    key: screenshotKey,
  }).catch((error) => {
    console.error("Local screenshot write failed.", error);
    return null;
  });

  const persistedScreenshotKey = uploadResult?.key ?? null;

  await sql`
    insert into analyses (
      id,
      auth_user_id,
      workspace_id,
      source,
      product_type,
      overall_score,
      main_finding,
      screenshot_key,
      report,
      created_at
    )
    values (
      ${report.id}::uuid,
      ${userId},
      ${workspaceId ? `${workspaceId}` : null}::uuid,
      ${source},
      ${report.summary.productType},
      ${report.summary.overallScore},
      ${report.summary.mainFinding},
      ${persistedScreenshotKey},
      ${JSON.stringify(report)}::jsonb,
      ${report.createdAt}::timestamptz
    )
    on conflict (id) do update set
      auth_user_id = excluded.auth_user_id,
      workspace_id = excluded.workspace_id,
      source = excluded.source,
      product_type = excluded.product_type,
      overall_score = excluded.overall_score,
      main_finding = excluded.main_finding,
      screenshot_key = excluded.screenshot_key,
      report = excluded.report,
      created_at = excluded.created_at
  `;

  return {
    id: report.id,
    screenshotUrl: persistedScreenshotKey ? `/api/screenshots/${report.id}` : null,
  };
}

export async function getPersistedAnalysisById(
  analysisId: string,
): Promise<PersistedAnalysisRecord | null> {
  if (!hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return null;
  }

  const sql = getDb();

  if (!sql) {
    return null;
  }

  const { user } = await getCurrentAuthSession();

  if (!user) {
    return null;
  }

  const [row] = (await sql`
    select
      id,
      created_at,
      main_finding,
      overall_score,
      product_type,
      report,
      screenshot_key,
      source,
      auth_user_id,
      workspace_id
    from analyses
    where id = ${analysisId}::uuid
      and auth_user_id = ${user.id}
    limit 1
  `) as AnalysisDbRow[];

  if (!row) {
    return null;
  }

  return {
    report: parseStoredReport(row.report),
    screenshotUrl: row.screenshot_key ? `/api/screenshots/${row.id}` : null,
    source: row.source,
  };
}

export async function getStoredScreenshotKeyForAnalysis(analysisId: string) {
  if (!hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return null;
  }

  const sql = getDb();

  if (!sql) {
    return null;
  }

  const { user } = await getCurrentAuthSession();

  if (!user) {
    return null;
  }

  const [row] = (await sql`
    select screenshot_key
    from analyses
    where id = ${analysisId}::uuid
      and auth_user_id = ${user.id}
    limit 1
  `) as Array<{ screenshot_key: string | null }>;

  return row?.screenshot_key ?? null;
}

export async function listPersistedAnalyses(workspaceId?: string | null) {
  if (!hasDatabaseConfig() || !hasNeonAuthConfig()) {
    return { analyses: null, user: null };
  }

  const sql = getDb();

  if (!sql) {
    return { analyses: null, user: null };
  }

  const { user } = await getCurrentAuthSession();

  if (!user) {
    return { analyses: [], user: null };
  }

  const analyses = workspaceId
    ? ((await sql`
        select
          id,
          created_at,
          main_finding,
          overall_score,
          product_type,
          report,
          screenshot_key,
          source,
          auth_user_id,
          workspace_id
        from analyses
        where auth_user_id = ${user.id}
          and workspace_id = ${workspaceId}::uuid
        order by created_at desc
        limit 24
      `) as AnalysisDbRow[])
    : ((await sql`
        select
          id,
          created_at,
          main_finding,
          overall_score,
          product_type,
          report,
          screenshot_key,
          source,
          auth_user_id,
          workspace_id
        from analyses
        where auth_user_id = ${user.id}
        order by created_at desc
        limit 24
      `) as AnalysisDbRow[]);

  return {
    analyses: analyses.map(toStoredAnalysisRow),
    user,
  };
}
