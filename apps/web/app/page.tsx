import { LeafAnalyzer } from "@/components/leaf-analyzer";

const principles = [
  ["Private by design", "The planned model runs in the browser, so the MVP does not need to upload a farmer’s photograph."],
  ["Honest uncertainty", "Low-confidence results ask for a clearer image or expert review instead of forcing a diagnosis."],
  ["Learning included", "Every supported result will connect symptoms and prevention guidance to a short recognition exercise."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AgriRakshak home"><span aria-hidden="true">AR</span>AgriRakshak</a>
        <a className="header-link" href="#how-it-works">How it works</a>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">College project exhibition · 2026</p>
          <h1>A clearer first look at crop health.</h1>
          <p className="lede">Upload a leaf photograph to explore AgriRakshak’s screening experience. The current milestone demonstrates the complete interface while the trained model is being prepared.</p>
        </div>
        <div className="hero-note">
          <strong>Current build</strong>
          <span>Interactive prototype</span>
          <p>Image selection and safety states are functional. Predictions are clearly marked simulations until an evaluated model is integrated.</p>
        </div>
      </section>

      <LeafAnalyzer />

      <section className="principles" id="how-it-works" aria-labelledby="principles-title">
        <p className="eyebrow">Product principles</p>
        <h2 id="principles-title">Designed for a responsible field demonstration</h2>
        <div className="principle-grid">
          {principles.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="responsibility-note">
        <strong>Responsible use</strong>
        <p>AgriRakshak provides preliminary screening and education. Confirm important crop-treatment decisions with a qualified agricultural professional.</p>
      </aside>
    </main>
  );
}
