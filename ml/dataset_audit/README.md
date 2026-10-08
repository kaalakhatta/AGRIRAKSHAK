# Dataset audit — partial foundation

These utilities inspect local files without changing dataset images. Generated fixtures are visibly synthetic and never establish accuracy or field/target-crop coverage. Reports may contain local dataset paths; keep real reports outside Git until a reviewed redaction step exists.

From the repository root, prepare an isolated environment and install only the scoped decoder:

```bash
python3 -m venv /tmp/agrirakshak-audit-venv
/tmp/agrirakshak-audit-venv/bin/python -m pip install -r ml/dataset_audit/requirements.txt
PYTHONPATH=ml /tmp/agrirakshak-audit-venv/bin/python -m dataset_audit --input ./sample-dataset --output /tmp/agrirakshak-audit-report
PYTHONPATH=ml /tmp/agrirakshak-audit-venv/bin/python -m dataset_audit.split_check ml/dataset_audit/fixtures/valid_manifest.jsonl
python3 -m unittest discover -s ml/dataset_audit/tests -v
```

Dataset audit writes JSON/CSV counts, dimensions, formats and exact-duplicate findings. The imbalance ratio is minimum/maximum valid-image class count, a descriptive QA statistic. Empty datasets, corrupt/unsupported inputs and reports located inside the input fail with a nonzero exit status. Reports are written for mixed valid/corrupt data so failed findings remain inspectable.

Manifest audit accepts train/val/validation/test splits, validates record types and hashes, checks exact-duplicate/leaf-group leakage and conflicting labels, and rejects synthetic validation/test entries. Missing leaf evidence stays unverified. The passing fixture contains synthetic training rows only; it is not an evaluation split. File-reference verification, full training-manifest compatibility and a reproducible baseline evidence audit remain follow-up work in Task 11 A4–A6.
