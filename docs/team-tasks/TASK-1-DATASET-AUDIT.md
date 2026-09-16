# Task 1: Dataset audit utility

## Ownership

- Branch: `ml/dataset-audit`
- Allowed path: `ml/dataset_audit/**`
- Do not change any other path.

## Goal

Build a small Python command-line utility that audits a class-folder image dataset without changing it. The real project dataset is not required.

## Input convention

```text
dataset/
  class-one/
    image-1.jpg
  class-two/
    image-2.png
```

## Required behavior

- recursively discover supported image files
- report class names and image counts
- detect unreadable or corrupt images
- report image dimensions and formats
- compute file hashes and report exact duplicates
- flag severe class imbalance using a clearly documented rule
- write both JSON and CSV summaries
- return a nonzero exit code for an invalid input path
- never rename, move, resize, or delete input images

## Deliverables

Create everything under `ml/dataset_audit/`, including:

- importable Python source code
- `README.md` with installation and usage
- dependency file if needed
- automated tests
- tiny generated or license-safe test fixtures
- example output

Do not download PlantVillage or commit a real dataset.

## Interface

The following form must work after following the README:

```bash
python -m dataset_audit --input ./sample-dataset --output ./report
```

## Completion evidence

The pull request must include the test command and output, an example report, and confirmation that no files outside `ml/dataset_audit/` changed.
