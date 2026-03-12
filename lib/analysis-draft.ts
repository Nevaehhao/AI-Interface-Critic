import type { AnalysisContext } from "@/lib/analysis-context";

export const PENDING_ANALYSIS_KEY = "ai-interface-critic.pending-analysis";

export type PendingAnalysisDraft = {
  captureMode: "upload" | "url-capture";
  context?: AnalysisContext;
  dataUrl: string | null;
  name: string | null;
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
  file: File | null,
  options?: {
    context?: AnalysisContext;
    workspaceId?: string | null;
    workspaceName?: string | null;
  },
) {
  const draft: PendingAnalysisDraft = {
    captureMode: file ? "upload" : "url-capture",
    context: options?.context,
    dataUrl: file ? await fileToDataUrl(file) : null,
    name: file?.name ?? null,
    size: file?.size ?? null,
    type: file?.type ?? null,
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

  return JSON.parse(rawValue) as PendingAnalysisDraft;
}

export function clearPendingAnalysisDraft() {
  window.sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
}

export async function dataUrlToFile(draft: PendingAnalysisDraft) {
  if (!draft.dataUrl || !draft.name || !draft.type) {
    return null;
  }

  const response = await fetch(draft.dataUrl);
  const blob = await response.blob();

  return new File([blob], draft.name, {
    type: draft.type,
  });
}
