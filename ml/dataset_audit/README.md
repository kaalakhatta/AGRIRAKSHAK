# Dataset audit — partial foundation

These utilities inspect local files without changing dataset images. Generated fixtures are visibly synthetic and never establish accuracy or field/target-crop coverage. Reports now use relative paths to prevent leaking private information and ensure input/output isolation.

## Installation

From the repository root, prepare an isolated environment and install the scope-local Pillow decoder:

```bash
python3 -m venv /tmp/agrirakshak-audit-venv
/tmp/agrirakshak-audit-venv/bin/python -m pip install -r ml/dataset_audit/requirements.txt
```

## Usage and Commands

### Dataset Audit
Passing command (assuming purely valid data):
```bash
PYTHONPATH=. /tmp/agrirakshak-audit-venv/bin/python -m ml.dataset_audit --input ml/dataset_audit/fixtures/valid_dataset --output /tmp/agrirakshak-audit-report
```

Failing command (corrupt/unsupported inputs, or output inside input):
```bash
PYTHONPATH=. /tmp/agrirakshak-audit-venv/bin/python -m ml.dataset_audit --input ml/dataset_audit/fixtures/valid_dataset --output ml/dataset_audit/fixtures/valid_dataset/report
```

### Manifest Audit
Passing command (with explicit data-dir check):
```bash
PYTHONPATH=. /tmp/agrirakshak-audit-venv/bin/python -m ml.dataset_audit.split_check ml/dataset_audit/fixtures/valid_manifest.jsonl --data-dir ml/dataset_audit/fixtures/valid_dataset
```

Failing command (manifest with leakage/errors):
```bash
PYTHONPATH=. /tmp/agrirakshak-audit-venv/bin/python -m ml.dataset_audit.split_check ml/dataset_audit/fixtures/invalid_manifest.jsonl --data-dir ml/dataset_audit/fixtures/valid_dataset
```

## Semantics

Dataset audit writes JSON/CSV counts, dimensions, formats and exact-duplicate findings.
- **Exact Duplicates**: Files sharing the exact same SHA-256 hash.
- **Class Counts**: Total number of verifiable, valid images in each class.
- **Imbalance Ratio**: The minimum class count divided by the maximum class count, providing a descriptive QA statistic (e.g., 1.0 means perfectly balanced, 0.1 means high imbalance).

Empty datasets, corrupt/unsupported inputs, and reports located inside the input fail with a nonzero exit status. Reports are written for mixed valid/corrupt data so failed findings remain inspectable. Reports are also safely generated with CSV injection protections and relative paths.

Manifest audit accepts train/val/validation/test splits, validates record types and hashes, checks exact-duplicate/leaf-group leakage and conflicting labels, and rejects synthetic validation/test entries. Missing leaf evidence stays unverified. File references are verified when `--data-dir` is provided.

## Examples

Example JSON and CSV reports can be found in `ml/dataset_audit/examples/`. These examples demonstrate the structure of the output, including relative path references, CSV safe-cell formatting (preventing injection), and duplicate tracking.

## Tests

To run the deterministic negative fixtures and tests:
```bash
python3 -m unittest discover -s ml/dataset_audit/tests -v
```
