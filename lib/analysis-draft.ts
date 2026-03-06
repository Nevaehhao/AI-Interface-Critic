export const PENDING_ANALYSIS_KEY = "ai-interface-critic.pending-analysis";

export type PendingAnalysisDraft = {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
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

export async function savePendingAnalysisDraft(file: File) {
  const dataUrl = await fileToDataUrl(file);
  const draft: PendingAnalysisDraft = {
    dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
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
