const capabilities = [
  ["Diagnose", "Capture or upload a leaf image and run a lightweight model on your device."],
  ["Understand", "See confidence, visible symptoms, prevention guidance, and clear safety limits."],
  ["Learn", "Study reviewed disease cards and reinforce recognition with short quizzes."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">College project exhibition · 2026</p>
        <h1>Crop disease screening that also teaches.</h1>
        <p className="lede">
          AgriRakshak is a privacy-friendly learning tool for farmers and students. The exhibition build will analyze leaf photos directly in the browser and remain useful when connectivity is weak.
        </p>
        <div className="actions">
          <span className="primary">Interactive demo coming next</span>
          <a href="https://github.com/kaalakhatta/AGRIRAKSHAK">View the build plan</a>
        </div>
      </section>

      <section className="capabilities" aria-label="Product capabilities">
        {capabilities.map(([title, description], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <aside>
        <strong>Responsible use</strong>
        <p>AgriRakshak provides preliminary screening and education. Confirm important crop-treatment decisions with a qualified agricultural professional.</p>
      </aside>
    </main>
  );
}
