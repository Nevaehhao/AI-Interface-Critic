export const PENDING_ANALYSIS_KEY = "ai-interface-critic.pending-analysis";

export type PendingAnalysisDraft = {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
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
  file: File,
  options?: {
    workspaceId?: string | null;
    workspaceName?: string | null;
  },
) {
  const dataUrl = await fileToDataUrl(file);
  const draft: PendingAnalysisDraft = {
    dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
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
  const response = await fetch(draft.dataUrl);
  const blob = await response.blob();

  return new File([blob], draft.name, {
    type: draft.type,
  });
}
