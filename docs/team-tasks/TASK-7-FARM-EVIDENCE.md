# Task 7: Colab training, model evaluation and supporting evidence

Contributor: Yashi (@yashitripathi2007)
Branch: `codex/farm-task-7-yashi`
Issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/10
Allowed scopes: `docs/research/**`, `ml/src/agrirakshak_ml/**`, `ml/tests/**`, `ml/notebooks/**`, `ml/pyproject.toml`, `ml/COLAB.md`, `ml/README.md`, `ml/MODEL_CARD_TEMPLATE.md`.
Owner reassignment: 2026-10-08. This replaces the earlier nine-package catalog assignment; preserve its completed work and history.

## Startup and ownership

Read root AGENTS.md, AGENT_START.md, PLAN.md, CONTRACT.md, the four farm-companion planning documents, scoped instructions and every existing file in your registered scopes. Inspect STATUS.md, issue #10, merged training PR #8 and literature PR #14. Your /claim was confirmed; verify the live assignee is your mapped account before resuming. Fetch main, inspect/resume the exact registered branch, or create it from origin/main if absent. One active agent and separate checkout for this task.

Arindam takes back the major intelligence work: farm-context binding, deterministic recommendations, seed/action/calendar/content schemas and catalogs, app/API/scanner integration, shared contracts and deployment. You own the existing image-model pipeline, free Google Colab notebook, training, calibration, evaluation, ONNX export and supporting scientific/dataset-license research. Anushka independently audits dataset/split/model evidence; she does not train. Kanika audits farm-data/regression cases; Aanya executes device/exhibition QA.

No data/catalog, apps/web, services, shared-contract, workflow or root-dependency edits. ML dependencies may be changed only in ml/pyproject.toml when essential to the existing free pipeline; document need/license/compatibility. Do not introduce paid/card-required compute, AI calls or automatic paid fallbacks. No datasets, weights/checkpoints, farmer photos, locations, credentials or notebook execution outputs containing them in Git. Preserve supplied local model artifacts.

## Six cumulative packages

### Y1 — Target-crop feasibility and dataset evidence

The owner-selected companion scope is Sehore, Madhya Pradesh, for soybean, wheat and gram/chickpea. The existing prepare_plantvillage.py currently selects bell pepper, potato and tomato; this is a historical scanner baseline, not target-crop coverage. Audit candidate image datasets for each requested crop: source/version, licenses and permitted use, healthy/disease/unsupported labels, real class counts, field versus controlled images, geographic/device gaps and expert label review. Report unsupported or unavailable coverage honestly. Do not relabel unrelated images or call source claims project metrics. Agree any crop expansion and preprocessing/label contract with Arindam on #10 before changing the baseline.

### Y2 — Preserve literature and source register

Preserve PR #14 commits, attribution and LITERATURE_REVIEW.md, BIBLIOGRAPHY.md and CLAIMS_REGISTER.md. Its docs/literature-review branch fails the registered branch check; migrate the reviewed work into the existing Task 7 branch after inspecting both branches and reference #14 in the replacement PR. Keep at least ten credible literature sources covering CNNs, transfer learning, controlled-background limitations, field generalization, leakage, imbalance, augmentation and calibration. Verify primary sources and retain original evaluation conditions. Keep dataset/license/claims/review-gap registers under docs/research. Any agronomy evidence is a source handoff to Arindam, not executable rules or expert approval.

### Y3 — Reproducible free Colab smoke run

Maintain ml/notebooks/agrirakshak_colab_training.ipynb and ml/COLAB.md, using the pipeline merged in #8 rather than creating a second trainer. Pin dataset/source versions and seeds, verify setup, manifest, grouped split, one-epoch smoke train, evaluation and export. Free GPU availability is optional and variable; document CPU smoke/failure/resume paths. No paid runtime or subscription. Export outputs before session expiry. Actual execution details belong in a source-linked run report; unexecuted notebook cells are not a successful run.

### Y4 — Training, calibration and independent evaluation

Use the untouched real-image test set only for final reporting; hyperparameters and calibration use train/validation data. Keep duplicates and same-leaf/source groups out of multiple splits. Document class balancing, augmentation, stopping rule, seeds and environment. Report real per-class precision/recall/F1/support, macro F1, confusion matrix, calibration and threshold/coverage protocol. Evaluate realistic field images independently where permitted; absent field validation remains a gap. Never invent accuracy or reviewer approval. Hand manifests/methods to Anushka without editing her audit directories.

### Y5 — Export bundle and model card

Deliver the existing versioned ONNX bundle contract with labels, preprocessing metadata, supported/unsupported crops, model version, real metrics and uncertainty/calibration metadata. Compare exported-model outputs against the evaluated checkpoint and document size/latency only where measured. Complete MODEL_CARD_TEMPLATE.md from actual evidence. Artifacts stay outside Git; coordinate an approved artifact handoff with Arindam. Do not write the model into apps/web/public or services yourself. Confidence is a model score, not diagnosis or farm-recommendation confidence.

### Y6 — Owner integration handoff

Provide commit/run IDs, dataset/version/license register, preprocessing/label contract, real metrics, model card, export checks and missing target-crop/device evidence. Arindam owns runtime integration and release decisions; Aanya verifies actual device behavior; Anushka audits evidence. Preserve the prior baseline until any replacement passes review. Target-crop screening stays unavailable until evaluated artifacts actually support it. Farm guidance remains separate and needs genuine agronomic review.

## Validation and submission

Run `python -m compileall ml/src` and the existing ML unit checks: from ml, `python -m pytest tests` and `ruff check src tests` when installed. Verify notebook JSON and reproducible commands. Execute and record smoke/train/evaluation/export checks when compute/data are available; never mark blocked checks passed. No additional real training is needed merely to validate a documentation PR.

Maintain docs/research/STATUS.md for evidence and ml/src/agrirakshak_ml/STATUS.md for pipeline/run handoff. Show diff, commit/push only the registered branch, open small package PRs with Task 7, Y1–Y6, `Refs #10`, changed scopes, checks/output, sources and limitations; request kaalakhatta review. Close #10 only after the whole cumulative task is finished. Never merge/push main. Record branch/PR and unfinished work before /unclaim.
