export type StepKey = "describe" | "analyze" | "interpret" | "judge";

export interface AnalysisStep {
  key: StepKey;
  number: string;
  title: string;
  body: string;
}

export interface ArtworkFacts {
  title: string;
  artist: string;
  date: string | null;
  period: string | null;
  culture: string | null;
  medium: string | null;
}

export type MuseumSource = "met" | "aic" | "commons";

export interface MuseumRecord {
  source: MuseumSource;
  sourceName: string;
  objectId: string;
  objectUrl: string;
  title: string;
  artist: string;
  date: string | null;
  medium: string | null;
  culture: string | null;
  period: string | null;
  creditLine: string | null;
  imageUrl: string;
  imageAlt: string;
}

export interface AnalysisResult {
  request: AnalyzeRequestBody;
  artwork: ArtworkFacts;
  museum: MuseumRecord | null;
  steps: AnalysisStep[];
  model: string;
  generatedAt: string;
}

export interface AnalyzeRequestBody {
  artist: string;
  title: string;
}

export const MAX_FIELD_LENGTH = 120;
