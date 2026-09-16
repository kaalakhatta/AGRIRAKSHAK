# Contributing

## Workflow

1. Pick or create a GitHub issue with a clear acceptance check.
2. Create a short branch such as `feat/upload-flow` or `ml/baseline-mobilenet`.
3. Keep code, content, and model experiments in separate commits where practical.
4. Run `npm run check` before opening a pull request.
5. Link evidence such as screenshots or metrics in the pull request.

Do not commit datasets, raw user photos, secrets, notebook outputs, or large model checkpoints. Add approved model releases through GitHub Releases when needed.

## Content review

Disease descriptions and prevention guidance require a source. Treatment-related content requires review by the named faculty or agriculture reviewer before it can be marked approved.

## Model changes

Every proposed model must record its dataset version, split seed, preprocessing, class list, per-class metrics, field-image results, model size, and browser latency.
