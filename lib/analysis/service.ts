import "server-only";

import { findCatalogArtwork } from "./catalog";
import { extractRequestedArtwork } from "./parse-prompt";
import type { AnalysisResult, AnalysisStep } from "./types";

const FRAMEWORK_STEPS: AnalysisStep[] = [
  {
    key: "describe",
    number: "STEP 01",
    title: "Describe",
    body: "Identify the artwork's title, artist, date, culture or historical period, medium, and important visual elements. Begin with what you can observe.",
  },
  {
    key: "analyze",
    number: "STEP 02",
    title: "Analyze",
    body: "Examine how the artist organizes the visual elements. Consider principles such as balance, contrast, emphasis, movement, rhythm, and unity.",
  },
  {
    key: "interpret",
    number: "STEP 03",
    title: "Interpret",
    body: "Consider what the artist may be communicating. Explore possible themes, symbols, intentions, and the historical or cultural context.",
  },
  {
    key: "judge",
    number: "STEP 04",
    title: "Judge",
    body: "Evaluate the artwork's significance and explain your response. Support your judgment with details you observed and learned.",
  },
];

const PREVIEW_NOTICE =
  "Preview version: this analysis shows the four-step framework. Live AI research, verified artwork matching, and source citations will be connected in a later development step.";

export function isLiveAnalysisConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function buildPreviewAnalysis(prompt: string): AnalysisResult {
  const requested = extractRequestedArtwork(prompt);
  const catalogMatch = findCatalogArtwork(requested);

  return {
    query: requested,
    subtitle: "Four-step analysis framework preview",
    artwork: catalogMatch ?? {
      title: requested,
      artist: null,
      date: null,
      medium: null,
      imageUrl: null,
      imageAlt: requested,
    },
    steps: FRAMEWORK_STEPS,
    mode: "preview",
    notice: PREVIEW_NOTICE,
  };
}

/**
 * Single entry point for generating an analysis. Runs only on the server, so
 * OPENAI_API_KEY is never bundled into client code.
 *
 * To enable live analysis, implement `generateLiveAnalysis` (for example with
 * the AI SDK's `generateObject` and a schema matching `AnalysisResult`) and
 * return its result here when `isLiveAnalysisConfigured()` is true.
 */
export async function generateAnalysis(prompt: string): Promise<AnalysisResult> {
  return buildPreviewAnalysis(prompt);
}
