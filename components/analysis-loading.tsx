const STEP_NAMES = ["Describe", "Analyze", "Interpret", "Judge"];

export function AnalysisLoading({ artist, title }: { artist: string; title: string }) {
  return (
    <>
      <div className="result-head">
        <div>
          <div className="eyebrow">Generating analysis</div>
          <h2>{title.trim() || "Your artwork"}</h2>
          <p>
            <span className="spinner spinner-dark" aria-hidden="true" />
            {`Searching museum collections and writing an analysis of ${artist.trim() || "this artist"}\u2019s work\u2026`}
          </p>
        </div>
      </div>
      <div className="result-grid">
        <div className="artwork-panel">
          <div className="artwork-placeholder skeleton-shimmer" aria-hidden="true" />
          <div className="skeleton-line skeleton-light" style={{ width: "70%", marginTop: 17 }} />
          <div className="skeleton-line skeleton-light" style={{ width: "45%" }} />
        </div>
        <div className="steps">
          {STEP_NAMES.map((name, index) => (
            <div className="step" key={name}>
              <div className="step-num">{`STEP 0${index + 1}`}</div>
              <h3>{name}</h3>
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" style={{ width: "60%" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
