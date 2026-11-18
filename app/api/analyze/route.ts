import { NextResponse } from "next/server";

import { AnalysisError, generateAnalysis } from "@/lib/analysis/service";
import { MAX_FIELD_LENGTH } from "@/lib/analysis/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function readField(body: unknown, key: "artist" | "title"): string {
  if (typeof body !== "object" || body === null || !(key in body)) return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const artist = readField(body, "artist");
  const title = readField(body, "title");

  if (!artist || !title) {
    return NextResponse.json(
      { error: "Please enter both the artist's name and the artwork title." },
      { status: 400 },
    );
  }

  if (artist.length > MAX_FIELD_LENGTH || title.length > MAX_FIELD_LENGTH) {
    return NextResponse.json(
      { error: `Please keep each field under ${MAX_FIELD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const analysis = await generateAnalysis({ artist, title });
    return NextResponse.json(analysis, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected analysis failure:", error);
    return NextResponse.json({ error: "We couldn't generate this analysis. Please try again." }, { status: 500 });
  }
}
