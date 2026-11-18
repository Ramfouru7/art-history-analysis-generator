const TILES = [
  { label: "01 / OBSERVE", title: "Describe" },
  { label: "02 / EXAMINE", title: "Analyze" },
  { label: "03 / DISCOVER", title: "Interpret" },
  { label: "04 / REFLECT", title: "Judge" },
];

export function FrameworkSection() {
  return (
    <section className="framework" aria-labelledby="framework-title">
      <div className="framework-head">
        <div>
          <div className="eyebrow">A simple path to deeper looking</div>
          <h2 id="framework-title">The four steps</h2>
        </div>
        <p>Build confidence with a repeatable method for looking closely at art from different cultures and periods.</p>
      </div>
      <ol className="tiles">
        {TILES.map((tile) => (
          <li className="tile" key={tile.title}>
            <span>{tile.label}</span>
            <strong>{tile.title}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
