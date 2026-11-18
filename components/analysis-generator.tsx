"use client";

import { useRef, useState, type FormEvent } from "react";

import { AnalysisLoading } from "@/components/analysis-loading";
import { AnalysisResults } from "@/components/analysis-results";
import { MAX_FIELD_LENGTH, type AnalysisResult } from "@/lib/analysis/types";

export function AnalysisGenerator() {
  const [artist, setArtist] = useState("Vincent van Gogh");
  const [title, setTitle] = useState("Wheat Field with Cypresses");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const artistRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const generatorRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  function scrollTo(element: HTMLElement | null) {
    requestAnimationFrame(() => element?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const trimmedArtist = artist.trim();
    const trimmedTitle = title.trim();
    if (!trimmedArtist || !trimmedTitle) {
      setError("Please enter both the artist's name and the artwork title.");
      (trimmedArtist ? titleRef : artistRef).current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    scrollTo(resultsRef.current);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist: trimmedArtist, title: trimmedTitle }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      setResult(data as AnalysisResult);
      scrollTo(resultsRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      scrollTo(generatorRef.current);
    } finally {
      setIsLoading(false);
    }
  }

  function startOver() {
    setResult(null);
    setError(null);
    setArtist("");
    setTitle("");
    scrollTo(generatorRef.current);
    artistRef.current?.focus({ preventScroll: true });
  }

  const showResults = isLoading || result !== null;

  return (
    <>
      <section ref={generatorRef} className="generator" id="generator" aria-labelledby="generator-title">
        <div className="generator-top">
          <div>
            <div className="eyebrow">Start exploring</div>
            <h2 id="generator-title">Generate an art analysis</h2>
          </div>
          <span className="pill">FOUR-STEP FRAMEWORK</span>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="artist">Artist</label>
              <input
                id="artist"
                ref={artistRef}
                type="text"
                value={artist}
                maxLength={MAX_FIELD_LENGTH}
                autoComplete="off"
                onChange={(event) => setArtist(event.target.value)}
                placeholder="Example: Vincent van Gogh"
                aria-invalid={error && !artist.trim() ? true : undefined}
                aria-describedby="searchHint"
              />
            </div>
            <div className="field">
              <label htmlFor="artworkTitle">Artwork title</label>
              <input
                id="artworkTitle"
                ref={titleRef}
                type="text"
                value={title}
                maxLength={MAX_FIELD_LENGTH}
                autoComplete="off"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Wheat Field with Cypresses"
                aria-invalid={error && !title.trim() ? true : undefined}
                aria-describedby="searchHint"
              />
            </div>
          </div>
          <div className="form-row">
            <span className="hint" id="searchHint">
              Tip: Use the artwork&apos;s full title for the most accurate museum image match.
            </span>
            <button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {"Generating\u2026"}
                </>
              ) : (
                "Generate Art Analysis \u2192"
              )}
            </button>
          </div>
        </form>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="notice">
          Artwork images come only from public-domain museum collections, starting with The Metropolitan Museum of
          Art Open Access program. The written analysis is generated by AI and should be checked against scholarly
          sources.
        </p>
      </section>

      <section
        ref={resultsRef}
        className={showResults ? "results show" : "results"}
        id="results"
        aria-live="polite"
        aria-busy={isLoading}
        aria-label="Your analysis"
      >
        {isLoading ? <AnalysisLoading artist={artist} title={title} /> : null}
        {!isLoading && result ? <AnalysisResults result={result} onStartOver={startOver} /> : null}
      </section>
    </>
  );
}
