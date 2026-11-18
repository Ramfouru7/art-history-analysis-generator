export type StepKey = "describe" | "analyze" | "interpret" | "judge";

export interface AnalysisStep {
  key: StepKey;
  number: string;
  title: string;
  body: string;
}

export interface ArtworkDetails {
  title: string;
  artist: string | null;
  date: string | null;
  medium: string | null;
  imageUrl: string | null;
  imageAlt: string;
}

export interface AnalysisResult {
  query: string;
  subtitle: string;
  artwork: ArtworkDetails;
  steps: AnalysisStep[];
  mode: "preview" | "live";
  notice: string | null;
}

export interface AnalyzeRequestBody {
  prompt: string;
}

export const MAX_PROMPT_LENGTH = 500;
