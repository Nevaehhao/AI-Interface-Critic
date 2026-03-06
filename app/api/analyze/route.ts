import { NextResponse } from "next/server";

import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { analyzeScreenshotWithOllama } from "@/lib/ollama-analysis";
import { persistAnalysis } from "@/lib/supabase/analysis-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  try {
    const ollamaAnalysis = await analyzeScreenshotWithOllama(file);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    await persistAnalysis({
      file,
      report: ollamaAnalysis,
      source: "ollama",
      userId: user?.id ?? null,
    }).catch((error) => {
      console.error("Supabase persistence failed.", error);
    });

    return NextResponse.json({
      analysis: ollamaAnalysis,
      source: "ollama",
    });
  } catch (error) {
    console.error("Ollama analysis failed, falling back to mock output.", error);
  }

  const mockResponse = createMockAnalyzeResponse();
  const mockAnalysis = createMockAnalysisReport({
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  await persistAnalysis({
    file,
    report: mockAnalysis,
    source: "mock",
    userId: user?.id ?? null,
  }).catch((error) => {
    console.error("Supabase persistence failed.", error);
  });

  return NextResponse.json({
    ...mockResponse,
    analysis: mockAnalysis,
  });
}
