# Task 11: Dataset integrity and model-evaluation audit

Contributor: Anushka (@AnushkaSChandel)
Branch: `codex/farm-task-11-anushka`
Issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/15
Allowed paths: `ml/dataset_audit/**` and `docs/model-validation/**`.
Owner reassignment: 2026-10-08. Historical Task 1 is a reference; use this active task and registered branch.

## Start and claim

Write access for AnushkaSChandel was verified on 2026-10-08. Verify your signed-in account and current access; accept an invitation only if one is still pending. Owner assignment to #15 is for discoverability and does not replace your /claim. Read root AGENTS.md, AGENT_START.md, docs/farm-context/PLAN.md, CONTRACT.md and BUILD_PLAN.md, DATA_MODEL.md, RECOMMENDATION_ENGINE.md, DELIVERY.md. Inspect your issue, branch/PRs, all owned files and scoped instructions. Post /claim using your mapped account and wait for bot confirmation/assignee verification. No editing from a pending invitation or an assignment alone. Create the exact branch from current origin/main only if absent; otherwise resume after inspecting it. One active agent/checkout.

## A1 — Read-only dataset integrity utility

Build a small Python CLI in ml/dataset_audit with source, README.md, tests, tiny generated fixtures and example reports. Reference historical TASK-1-DATASET-AUDIT.md without starting ml/dataset-audit. Support a class-folder dataset, counts/classes, corrupt/unsupported images, dimensions/formats, SHA-256 exact duplicates, and clearly documented class-imbalance summaries. Never change input images or download a real dataset automatically. Output JSON and CSV reports; invalid input returns nonzero. Report absent data as unavailable, not a pass. Dataset distribution thresholds are QA policy, never agronomic thresholds.

Document `python -m dataset_audit --input ./sample-dataset --output ./report` after the scoped setup. Standard library first; Pillow may be declared in this directory only if decoding needs it. No root dependency edits, training pipeline changes or paid tooling. Synthetic fixtures stay visibly labelled and cannot become test-set accuracy evidence.

## A2 — Split and leakage checks

Audit supplied manifest/split records without loading private images into Git. Check required IDs/hashes/labels/splits, conflicting labels, missing references, exact duplicate or leaf-group leakage across train/validation/test, and synthetic records in validation/test. Missing leaf IDs or unavailable grouping evidence are explicit unverified findings. Record source/revision and grouping policy. Coordinate the existing ML manifest shape with Arindam rather than modifying ml/src.

Provide deterministic valid/invalid synthetic fixtures and actionable JSON findings with nonzero invalid exit status. Aggregate reports in Git must exclude private paths, farmer photos/coordinates and sensitive identifiers.

## A3 — Independent model-evaluation readiness packet

In docs/model-validation create EVALUATION_CHECKLIST.md, METRICS_REGISTER.md, FIELD_IMAGE_PROTOCOL.md, MODEL_BUNDLE_CHECKLIST.md and STATUS.md. Map dataset/version/split seed/labels/preprocessing to evaluation evidence, per-class precision/recall/F1, confusion matrix, calibration/uncertainty, unsupported inputs, model size and latency. Missing metrics/artifacts remain TBD. Do not train, calibrate, export, deploy or modify model artifacts; Yashi owns training/calibration/evaluation/export; Arindam owns runtime integration and deployment. Read existing ML docs/model-card templates and identify gaps instead of fabricating results.

Plan consented, non-identifying phone/field-image evaluation separately from controlled-background data. Include limitations and a reviewer handoff; do not collect or message people without authorization. Yashi owns citation/license research; reference her verified sources and flag gaps rather than duplicate the literature review. Aanya owns device/browser measurements and provides observed timings when available.

## Milestones and checks

- M0–M1: A1 dataset utility and examples.
- M2–M3: A2 manifest/split leakage fixtures and report format.
- M4–M5: A3 evidence register and independent readiness audit of supplied artifacts; unavailable artifacts are blocked, not pass.

Run `python3 -m unittest discover -s ml/dataset_audit/tests -v`, a passing/failing CLI example, JSON/CSV inspection and git diff --check. Verify input file hashes are unchanged by the audit. Record commands/output and next actions in STATUS.md in both owned directories. No dataset, checkpoint, weight, notebook output, secret, user photo or precise farmer location in Git.

Submit Task 11 milestone PRs with Refs #15, exact paths, checks/evidence/limitations and kaalakhatta review. Closes only for full cumulative completion. No web/API/shared-contract/workflow changes. Never merge, push main, force-reset existing work or claim another contributor's task.
