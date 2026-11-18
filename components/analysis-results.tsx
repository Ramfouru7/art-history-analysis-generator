"use client";

import { useState } from "react";

import type { AnalysisResult } from "@/lib/analysis/types";

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  const { artwork, steps } = result;
  const meta = [artwork.artist, artwork.date, artwork.medium].filter(Boolean).join(" \u00B7 ");

  return (
    <>
      <div className="result-head">
        <div>
          <div className="eyebrow">Your analysis</div>
          <h2>{result.query}</h2>
          <p>{result.subtitle}</p>
        </div>
        <button type="button" className="print-button" onClick={() => window.print()}>
          {"Print this page \u2197"}
        </button>
      </div>
      <div className="result-grid">
        <aside className="artwork-panel">
          <ArtworkImage key={artwork.imageUrl ?? artwork.title} src={artwork.imageUrl} alt={artwork.imageAlt} />
          <h3>{artwork.title}</h3>
          <p>{meta || "Artwork details will appear once verified matching is connected."}</p>
        </aside>
        <div className="steps">
          {steps.map((step) => (
            <article className="step" key={step.key}>
              <div className="step-num">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
      {result.notice ? <div className="notice">{result.notice}</div> : null}
    </>
  );
}

function ArtworkImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="artwork-placeholder" aria-hidden="true">
        <span>{alt.charAt(0).toUpperCase() || "A"}</span>
      </div>
    );
  }

  // Plain <img> keeps the original graceful fallback when a museum image cannot load.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
}
