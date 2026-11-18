import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { findMuseumArtwork } from "./museum";
import type { AnalysisResult, AnalysisStep, AnalyzeRequestBody, MuseumRecord } from "./types";

const DEFAULT_MODEL = "gpt-5-mini";

export class AnalysisError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

const AnalysisSchema = z.object({
  identified: z
    .boolean()
    .describe("True only if you are confident this specific artwork by this artist exists and you know it."),
  notIdentifiedReason: z
    .string()
    .nullable()
    .describe("When identified is false, a short, friendly explanation. Otherwise null."),
  artwork: z.object({
    title: z.string(),
    artist: z.string(),
    date: z.string().nullable(),
    period: z.string().nullable().describe("Art-historical period or movement."),
    culture: z.string().nullable(),
    medium: z.string().nullable(),
  }),
  describe: z.string(),
  analyze: z.string(),
  interpret: z.string(),
  judge: z.string(),
});

const INSTRUCTIONS = `You are an art historian writing a clear, accurate four-step formal analysis for students.

Write 3 to 4 complete sentences for each section:
- describe: Identify the artwork, artist, creation date, historical period, culture, medium, and materials, then describe the important visual elements a viewer can observe.
- analyze: Explain how the elements of art (line, shape, color, value, texture, space, form) and principles of design (balance, contrast, emphasis, movement, rhythm, pattern, unity) work in the composition.
- interpret: Explain possible meanings, symbols, themes, and the artist's intentions. Clearly separate documented facts (for example, "The artist wrote that...") from interpretation (for example, "This may suggest...").
- judge: Explain the artwork's historical significance and give a reasoned evaluation supported by specific observations from the earlier steps.

Accuracy rules:
- If a museum record is provided, treat its title, artist, date, and medium as authoritative and do not contradict them.
- Do not invent dates, provenance, quotations, or locations. If you are unsure of a detail, omit it or say it is uncertain.
- If you do not recognize this specific artwork by this artist, set identified to false, explain why in notIdentifiedReason, and leave the four sections as empty strings.
- Do not claim the analysis was researched or verified. Write plain prose without markdown.`;

function buildInput(request: AnalyzeRequestBody, museum: MuseumRecord | null): string {
  const lines = [`Artist: ${request.artist}`, `Artwork title: ${request.title}`];
  if (museum) {
    lines.push(
      "",
      `Museum record from ${museum.sourceName}:`,
      JSON.stringify({
        title: museum.title,
        artist: museum.artist,
        date: museum.date,
        medium: museum.medium,
        culture: museum.culture,
        period: museum.period,
      }),
    );
  } else {
    lines.push("", "No matching museum record was found. Rely only on well-established knowledge.");
  }
  return lines.join("\n");
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new AnalysisError(
      "The analysis service is not configured yet. Add an OPENAI_API_KEY environment variable to enable it.",
      503,
    );
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function toFriendlyError(error: unknown): AnalysisError {
  if (error instanceof AnalysisError) return error;
  if (error instanceof OpenAI.APIError) {
    console.error("OpenAI request failed:", error.status, error.message);
    if (error.status === 401 || error.status === 403) {
      return new AnalysisError("The analysis service is not authorized. Please check the server's OpenAI API key.", 503);
    }
    if (error.status === 429) {
      return new AnalysisError("The analysis service is busy right now. Please wait a moment and try again.", 429);
    }
  } else {
    console.error("Analysis generation failed:", error);
  }
  return new AnalysisError("We couldn't generate this analysis. Please try again.", 502);
}

export async function generateAnalysis(request: AnalyzeRequestBody): Promise<AnalysisResult> {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const museum = await findMuseumArtwork(request.artist, request.title);

  let parsed: z.infer<typeof AnalysisSchema> | null;
  try {
    const response = await openai.responses.parse({
      model,
      instructions: INSTRUCTIONS,
      input: buildInput(request, museum),
      text: { format: zodTextFormat(AnalysisSchema, "art_analysis") },
    });
    parsed = response.output_parsed;
  } catch (error) {
    throw toFriendlyError(error);
  }

  if (!parsed) {
    throw new AnalysisError("We couldn't generate this analysis. Please try again.", 502);
  }

  if (!parsed.identified) {
    throw new AnalysisError(
      parsed.notIdentifiedReason ||
        `We couldn't confidently identify "${request.title}" by ${request.artist}. Check the spelling and try again.`,
      404,
    );
  }

  const steps: AnalysisStep[] = [
    { key: "describe", number: "STEP 01", title: "Describe", body: parsed.describe },
    { key: "analyze", number: "STEP 02", title: "Analyze", body: parsed.analyze },
    { key: "interpret", number: "STEP 03", title: "Interpret", body: parsed.interpret },
    { key: "judge", number: "STEP 04", title: "Judge", body: parsed.judge },
  ];

  return {
    request,
    artwork: museum
      ? {
          ...parsed.artwork,
          title: museum.title,
          artist: museum.artist,
          date: museum.date ?? parsed.artwork.date,
          medium: museum.medium ?? parsed.artwork.medium,
        }
      : parsed.artwork,
    museum,
    steps,
    model,
    generatedAt: new Date().toISOString(),
  };
}
