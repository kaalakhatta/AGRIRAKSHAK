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

## Owner-assigned follow-up A4–A6 — 2026-10-08

PR #21 provides the partial A1–A3 foundation with owner review corrections. Twelve scoped tests verify its current behavior; actual model/field/device evidence is not completed. Preserve these commits and continue the same cumulative issue #15, registered branch and two owned directories. Obtain your own confirmed /claim before new edits. Deliver A4 first, then independently available A5 evidence, then A6; do not wait for target-crop training to audit the supplied baseline.

### A4 — Manifest compatibility and safe report hardening

Extend the utility to validate actual training manifest/split records without editing ml/src. Record the supplied format/version and mapping; validate required IDs/types/hashes, duplicate IDs, relative file references/missing files, unsupported splits, and conflicting synthetic/grouping provenance. Missing leaf/source grouping remains explicitly unverified. Add deterministic fixtures for empty/corrupt JSONL, scalar/object/type errors, invalid hashes, unknown split aliases, absent references, duplicate/leaf leakage and synthetic evaluation contamination. Keep input files read-only; reject reports within input trees, handle unreadable files and symlinks conservatively, and verify input hashes before/after.

Provide a reviewed aggregate/redacted report mode for sharing: no absolute private paths, farmer IDs, photos, coordinates or secrets. CSV cells must not become executable spreadsheet formulas. Document exact duplicate/class-count/imbalance semantics, scope-local Pillow installation and passing/failing commands. Add example reports generated from labelled synthetic fixtures; structured findings and deterministic nonzero invalid exits are acceptance requirements. No root/training dependency changes.

### A5 — Supplied baseline bundle and evaluation evidence audit

Audit the existing pepper/potato/tomato baseline-v1 handoff now; soybean/wheat/chickpea artifacts are not prerequisites. Request/reuse supplied local labels, preprocessing metadata, version, metrics, model-card and source/license/run/split/export evidence. Do not download or commit weights or real images, train, calibrate or change artifacts. Compare label count/order, preprocessing dimensions/normalization, supported/unsupported crops and uncertainty policy against the declared runtime/training contract; mark missing tensor/export verification unverified.

Create BASELINE_AUDIT.md and update METRICS_REGISTER.md/MODEL_BUNDLE_CHECKLIST.md with each claim’s source/revision/run or artifact reference, supplied value where available, evidence status and gaps. Pipeline support is not proof of an executed evaluation. Distinguish source-reported metrics from independently verified project results; actual target-crop/field validation stays absent unless provided. Model bytes can be measured locally and reported with version/digest; latency requires Aanya’s observed device evidence. Never invent a size/latency budget, accuracy or reviewer approval.

### A6 — Exhibition model-readiness and regression evidence packet

Create EXHIBITION_MODEL_READINESS.md with an evidence table and explicit ready/blocked/not-run findings for baseline provenance, scope/labels, metrics/calibration, field/target-crop gaps, artifact integrity and actual-device behavior. Reference Aanya’s camera/upload/offline/download measurements and Yashi’s run/source/model-card evidence; do not duplicate their work or mark absent evidence passed. Supply small synthetic input-contract/negative-case expectations and trace them to audit findings for owner runtime regression checks; do not modify app/API code.

Hand off a prioritized defect/gap register, judge-safe model claim wording, named evidence owners and next actions to Arindam. Explain the difference between a running supplied baseline, synthetic transport smoke, controlled-background evaluation and real field validation. The owner decides release readiness; the packet is an independent evidence assessment, not agronomy approval or diagnosis. Field-image collection remains a plan and requires separate consent/authorization.

## Milestones and checks

- M0–M1: A1 dataset utility and examples.
- M2–M3: A2 foundations and A4 manifest/report hardening with regression evidence.
- M4–M5: A3 protocol foundation, A5 supplied-baseline evidence audit and A6 exhibition readiness packet; unavailable evidence is blocked/not-run, not pass.

Run `python3 -m unittest discover -s ml/dataset_audit/tests -v`, a passing/failing CLI example, JSON/CSV inspection and git diff --check. Verify input file hashes are unchanged by the audit. Record commands/output and next actions in STATUS.md in both owned directories. No dataset, checkpoint, weight, notebook output, secret, user photo or precise farmer location in Git.

Submit Task 11 milestone PRs with Refs #15, exact paths, checks/evidence/limitations and kaalakhatta review. Closes only for full cumulative completion. No web/API/shared-contract/workflow changes. Never merge, push main, force-reset existing work or claim another contributor's task.
