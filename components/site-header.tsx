export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav">
        <a className="brand" href="/" aria-label="Art History Analysis Generator home">
          <div className="brand-mark" aria-hidden="true">
            A
          </div>
          <div>
            ART HISTORY<small>ANALYSIS GENERATOR</small>
          </div>
        </a>
        <div className="nav-note">A fresh perspective on the art of the past</div>
      </div>
    </header>
  );
}
