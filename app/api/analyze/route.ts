import { NextResponse } from "next/server";

import { generateAnalysis } from "@/lib/analysis/service";
import { MAX_PROMPT_LENGTH } from "@/lib/analysis/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string"
      ? body.prompt.trim()
      : "";

  if (!prompt) {
    return NextResponse.json({ error: "Please enter an artist or artwork to explore." }, { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Please keep your request under ${MAX_PROMPT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const analysis = await generateAnalysis(prompt);
    return NextResponse.json(analysis, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analysis generation failed:", error);
    return NextResponse.json({ error: "We couldn't generate this analysis. Please try again." }, { status: 500 });
  }
}
