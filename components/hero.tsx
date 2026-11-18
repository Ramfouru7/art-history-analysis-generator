import Image from "next/image";

export function Hero() {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">Look closer. Think deeper.</div>
        <h1>
          Every artwork
          <br />
          has a story.
          <br />
          <em>Find yours.</em>
        </h1>
        <p className="intro">
          Explore artists and artworks through a clear, guided process. Describe what you see, analyze how it
          works, interpret its meaning, and form your own judgment.
        </p>
      </div>
      <div className="art-collage" role="img" aria-label="Art-inspired image collage">
        <div className="art-card art-main">
          <Image
            src="/images/impressionist-garden.png"
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 70vw, 380px"
          />
        </div>
        <div className="art-card art-side">
          <Image src="/images/swirling-night.png" alt="" fill sizes="(max-width: 760px) 45vw, 240px" />
        </div>
        <div className="sticker" aria-hidden="true">
          ART
          <br />
          MEETS
          <br />
          INSIGHT
        </div>
      </div>
    </section>
  );
}
