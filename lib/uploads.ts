export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_MB = 8;
export const MAX_FLOW_SCREENSHOTS = 5;

export function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Use a PNG, JPG, or WebP screenshot.";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `Keep the screenshot under ${MAX_UPLOAD_SIZE_MB}MB.`;
  }

  return null;
}

export function validateImageFiles(files: File[]) {
  if (files.length > MAX_FLOW_SCREENSHOTS) {
    return `Use up to ${MAX_FLOW_SCREENSHOTS} screenshots per batch.`;
  }

  for (const file of files) {
    const validationError = validateImageFile(file);

    if (validationError) {
      return validationError;
    }
  }

  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
