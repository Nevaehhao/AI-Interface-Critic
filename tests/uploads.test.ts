import { describe, expect, it } from "vitest";

import {
  MAX_FLOW_SCREENSHOTS,
  MAX_UPLOAD_SIZE_BYTES,
  formatBytes,
  validateImageFile,
  validateImageFiles,
} from "../lib/uploads";

describe("upload validation", () => {
  it("accepts supported image files", () => {
    const file = new File(["image"], "screen.png", { type: "image/png" });

    expect(validateImageFile(file)).toBeNull();
  });

  it("rejects unsupported file types", () => {
    const file = new File(["text"], "notes.txt", { type: "text/plain" });

    expect(validateImageFile(file)).toBe("Use a PNG, JPG, or WebP screenshot.");
  });

  it("rejects files that exceed the max size", () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1)], "huge.png", {
      type: "image/png",
    });

    expect(validateImageFile(file)).toBe("Keep the screenshot under 8MB.");
  });

  it("formats bytes for file metadata labels", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("rejects batches above the flow screenshot limit", () => {
    const files = Array.from({ length: MAX_FLOW_SCREENSHOTS + 1 }, (_, index) =>
      new File(["image"], `screen-${index + 1}.png`, { type: "image/png" }),
    );

    expect(validateImageFiles(files)).toBe("Use up to 5 screenshots per batch.");
  });
});
