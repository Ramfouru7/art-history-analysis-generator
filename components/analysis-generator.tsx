"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { AnalysisResults } from "@/components/analysis-results";
import { MAX_PROMPT_LENGTH, type AnalysisResult } from "@/lib/analysis/types";

const DEFAULT_PROMPT = "Create an art analysis of Vincent van Gogh's The Starry Night.";

export function AnalysisGenerator() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  async function submit() {
    if (isLoading) return;
    if (!prompt.trim()) {
      promptRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data as AnalysisResult);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    void submit();
  }

  return (
    <>
      <section className="generator" id="generator" aria-labelledby="generator-title">
        <div className="generator-top">
          <div>
            <div className="eyebrow">Start exploring</div>
            <h2 id="generator-title">Generate an art analysis</h2>
          </div>
          <span className="pill">FOUR-STEP FRAMEWORK</span>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="artPrompt">Which artist or artwork would you like to explore?</label>
          <textarea
            id="artPrompt"
            ref={promptRef}
            value={prompt}
            maxLength={MAX_PROMPT_LENGTH}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: Create an art analysis of Vincent van Gogh's The Starry Night."
            aria-describedby="artPromptHint"
            aria-invalid={error ? true : undefined}
          />
          <div className="form-row">
            <span className="hint" id="artPromptHint">
              Tip: Include both the artist&apos;s name and the artwork title.
            </span>
            <button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? "Generating\u2026" : "Preview analysis \u2192"}
            </button>
          </div>
        </form>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="notice">
          Preview version: this starter website demonstrates the layout and interaction. Live AI research,
          verified artwork matching, and source citations will be connected in a later development step.
        </div>
      </section>

      <section
        ref={resultsRef}
        className={result ? "results show" : "results"}
        id="results"
        aria-live="polite"
        aria-label="Your analysis"
      >
        {result ? <AnalysisResults result={result} /> : null}
      </section>
    </>
  );
}
