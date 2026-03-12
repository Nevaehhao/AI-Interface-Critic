import type { AnalysisContext } from "@/lib/analysis-context";

export const PENDING_ANALYSIS_KEY = "ai-interface-critic.pending-analysis";

export type PendingAnalysisScreenshot = {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
};

export type PendingAnalysisDraft = {
  captureMode: "upload" | "url-capture";
  context?: AnalysisContext;
  dataUrl: string | null;
  name: string | null;
  screenshots: PendingAnalysisScreenshot[];
  size: number | null;
  type: string | null;
  workspaceId?: string | null;
  workspaceName?: string | null;
};

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected file."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

export async function savePendingAnalysisDraft(
  files: File[] | File | null,
  options?: {
    context?: AnalysisContext;
    workspaceId?: string | null;
    workspaceName?: string | null;
  },
) {
  const normalizedFiles = Array.isArray(files) ? files : files ? [files] : [];
  const screenshots = await Promise.all(
    normalizedFiles.map(async (file) => ({
      dataUrl: await fileToDataUrl(file),
      name: file.name,
      size: file.size,
      type: file.type,
    })),
  );
  const primaryScreenshot = screenshots[0] ?? null;
  const draft: PendingAnalysisDraft = {
    captureMode: normalizedFiles.length > 0 ? "upload" : "url-capture",
    context: options?.context,
    dataUrl: primaryScreenshot?.dataUrl ?? null,
    name: primaryScreenshot?.name ?? null,
    screenshots,
    size: primaryScreenshot?.size ?? null,
    type: primaryScreenshot?.type ?? null,
    workspaceId: options?.workspaceId ?? null,
    workspaceName: options?.workspaceName ?? null,
  };

  window.sessionStorage.setItem(PENDING_ANALYSIS_KEY, JSON.stringify(draft));
}

export function loadPendingAnalysisDraft() {
  const rawValue = window.sessionStorage.getItem(PENDING_ANALYSIS_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedDraft = JSON.parse(rawValue) as Partial<PendingAnalysisDraft>;

  return {
    captureMode:
      parsedDraft.captureMode === "url-capture" ? "url-capture" : "upload",
    context: parsedDraft.context,
    dataUrl: parsedDraft.dataUrl ?? null,
    name: parsedDraft.name ?? null,
    screenshots: Array.isArray(parsedDraft.screenshots) ? parsedDraft.screenshots : [],
    size: typeof parsedDraft.size === "number" ? parsedDraft.size : null,
    type: parsedDraft.type ?? null,
    workspaceId: parsedDraft.workspaceId ?? null,
    workspaceName: parsedDraft.workspaceName ?? null,
  } satisfies PendingAnalysisDraft;
}

export function clearPendingAnalysisDraft() {
  window.sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
}

export function getPendingAnalysisScreenshots(draft: PendingAnalysisDraft) {
  if (draft.screenshots.length > 0) {
    return draft.screenshots;
  }

  if (!draft.dataUrl || !draft.name || !draft.type || typeof draft.size !== "number") {
    return [];
  }

  return [
    {
      dataUrl: draft.dataUrl,
      name: draft.name,
      size: draft.size,
      type: draft.type,
    },
  ];
}

export async function pendingScreenshotToFile(
  screenshot: PendingAnalysisScreenshot,
) {
  const response = await fetch(screenshot.dataUrl);
  const blob = await response.blob();

  return new File([blob], screenshot.name, {
    type: screenshot.type,
  });
}

export async function dataUrlToFile(draft: PendingAnalysisDraft) {
  const primaryScreenshot = getPendingAnalysisScreenshots(draft)[0];

  if (!primaryScreenshot) {
    return null;
  }

  return pendingScreenshotToFile(primaryScreenshot);
}
