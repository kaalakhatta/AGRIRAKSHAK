# AgriRakshak

AgriRakshak is a college exhibition project that turns a crop-leaf photo into a preliminary disease screening, a confidence score, practical guidance, and a short learning activity.

> AgriRakshak is an educational screening aid. It does not replace advice from a qualified agricultural professional, and it must not recommend pesticide dosages.

## Exhibition MVP

- Upload or capture one leaf image
- Run a lightweight ONNX classifier in the browser
- Show the predicted crop and condition with calibrated confidence
- Return an “uncertain” result below a documented threshold
- Explain symptoms, prevention, and when to seek expert help
- Offer a short quiz linked to each disease
- Compare the baseline model with the final augmented model on a real-image test set
- Work as an installable PWA after the first visit

## Free-first architecture

| Area | Choice | Cost |
| --- | --- | --- |
| Web app | Next.js, TypeScript, Tailwind CSS | Free and open source |
| Inference | ONNX Runtime Web in the browser | No inference server bill |
| Content | Versioned JSON in this repository | Free |
| Training | PyTorch in Google Colab or Kaggle notebooks | Free tier |
| Hosting | Vercel or GitHub Pages-compatible static export | Free tier |
| CI | GitHub Actions | Free for this public repository |

The MVP deliberately avoids authentication and a database. Those features do not improve the exhibition demo enough to justify extra failure points.

## Repository map

```text
apps/web/            Next.js PWA and browser inference UI
data/catalog/        Reviewed crop and disease education content
ml/                  Training, evaluation, and model-export workspace
docs/                Architecture, roadmap, and project decisions
.github/              CI, issue templates, and contribution workflow
```

## Local development

Prerequisites: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The current scaffold presents the product scope; image inference will be added when the first exported model and label map are ready.

## Definition of a successful exhibition demo

1. A visitor can open the app and analyze a prepared leaf photo without signing in.
2. The same model produces a reproducible metrics report on a held-out real-image test set.
3. The result distinguishes model confidence from diagnostic certainty.
4. The team can demonstrate low-confidence handling and explain the model’s limitations.
5. The demo continues to work if the venue Wi-Fi becomes unreliable.

Read the [delivery roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md), and [contribution guide](CONTRIBUTING.md) before starting a task.

## License

Source code is available under the [MIT License](LICENSE). Dataset images, trained weights, and third-party content keep their original licenses and must be documented separately before redistribution.
