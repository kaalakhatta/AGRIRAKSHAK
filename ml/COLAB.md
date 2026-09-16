# Running the baseline in Google Colab

Colab provides free compute but its availability and accelerator type can change. Keep all commands reproducible and download the final artifacts before the session expires.

## Setup

1. Create a new Colab notebook.
2. Select a GPU runtime if one is available. CPU also works for smoke tests.
3. Clone the repository and install the ML package.

```python
!git clone https://github.com/kaalakhatta/AGRIRAKSHAK.git
%cd AGRIRAKSHAK/ml
!python -m pip install -e .
```

Mount Google Drive only if the dataset license permits storing it there. Never commit Drive credentials, dataset archives, or personal paths.

## Recommended first run

Use a small subset and one epoch to prove that manifest creation, splitting, training, evaluation, and export all work. Only then run the complete experiment.

```bash
agrirakshak-manifest --input /content/dataset --output artifacts/manifest.jsonl
agrirakshak-split --manifest artifacts/manifest.jsonl --output artifacts/split-manifest.jsonl --seed 130
agrirakshak-train --manifest artifacts/split-manifest.jsonl --data-root /content/dataset --output runs/smoke --epochs 1 --batch-size 16
```

Save `manifest.jsonl`, `split-manifest.jsonl`, the best checkpoint, history, evaluation report, exported bundle, notebook, and model card. Do not report results from a smoke test as final metrics.
