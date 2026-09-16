# AgriRakshak intelligence layer

This workspace contains the reproducible path from a class-folder image dataset to a browser-ready ONNX model bundle.

```text
raw class folders
  -> manifest and duplicate audit
  -> leakage-safe train/validation/test split
  -> MobileNetV3-Small transfer learning
  -> real-image evaluation and confidence calibration
  -> versioned ONNX bundle
  -> ONNX Runtime Web
```

Synthetic images are not part of the baseline. If introduced later, they may appear only in training and must be compared against the same untouched real-image test set.

## Quick start

Use Python 3.11 or 3.12 in a local environment, Google Colab, or Kaggle:

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

Prepare class folders such as `dataset/tomato___healthy/` and `dataset/tomato___early_blight/`, then run:

```bash
agrirakshak-manifest --input /path/to/dataset --output artifacts/manifest.jsonl
agrirakshak-split --manifest artifacts/manifest.jsonl --output artifacts/split-manifest.jsonl --seed 130
agrirakshak-train --manifest artifacts/split-manifest.jsonl --data-root /path/to/dataset --output runs/baseline
agrirakshak-evaluate --manifest artifacts/split-manifest.jsonl --data-root /path/to/dataset --checkpoint runs/baseline/best.pt --output runs/baseline/evaluation
agrirakshak-export --checkpoint runs/baseline/best.pt --evaluation runs/baseline/evaluation/metrics.json --output ../apps/web/public/models/baseline-v1
```

## Evaluation rules

- Never select hyperparameters using the test split.
- Never place exact duplicate images across splits.
- Never place generated images in validation or test.
- Report per-class precision, recall, F1, support, confusion matrix, macro F1, calibration, uncertainty threshold, and coverage.
- Keep lab and field-source results separate when source metadata becomes available.
- Treat confidence as a model score, not diagnostic certainty.

See [MODEL_CARD_TEMPLATE.md](MODEL_CARD_TEMPLATE.md) before publishing a model.
