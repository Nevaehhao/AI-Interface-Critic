import { NextResponse } from "next/server";

import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { validateImageFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A screenshot file is required." },
      { status: 400 },
    );
  }

  const validationError = validateImageFile(file);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const mockResponse = createMockAnalyzeResponse();

  return NextResponse.json({
    ...mockResponse,
    analysis: createMockAnalysisReport({
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    }),
  });
}
