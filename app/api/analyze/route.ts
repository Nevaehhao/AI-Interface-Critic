import { NextResponse } from "next/server";

import { createMockAnalyzeResponse } from "@/lib/analysis-result";
import { createMockAnalysisReport } from "@/lib/analysis-report";
import { analyzeScreenshotWithOpenAI } from "@/lib/openai-analysis";
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
    const openAIAnalysis = await analyzeScreenshotWithOpenAI(file);

    if (openAIAnalysis) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

      await persistAnalysis({
        file,
        report: openAIAnalysis,
        source: "openai",
        userId: user?.id ?? null,
      }).catch((error) => {
        console.error("Supabase persistence failed.", error);
      });

      return NextResponse.json({
        analysis: openAIAnalysis,
        source: "openai",
      });
    }
  } catch (error) {
    console.error("OpenAI analysis failed, falling back to mock output.", error);
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
