# Status: Model-Evaluation Audit

- **Task:** 11 — Dataset integrity and model-evaluation audit
- **Contributor:** Anushka (@AnushkaSChandel)
- **Branch:** codex/farm-task-11-anushka
- **Issue:** #15
- **Current Milestone:** A3 — Model-evaluation readiness packet

## Files Created
- `EVALUATION_CHECKLIST.md`: Comprehensive model-evaluation readiness checklist, highlighting gaps for target crops.
- `METRICS_REGISTER.md`: Register documenting all evaluation metrics used in the pipeline and identifying missing metrics.
- `FIELD_IMAGE_PROTOCOL.md`: Protocol for planned field-image evaluation, emphasizing privacy and controlled vs. field comparison.
- `MODEL_BUNDLE_CHECKLIST.md`: Readiness checklist for model bundle export and deployment.

## Evidence
- Analyzed existing ML pipeline code (`ml/src/agrirakshak_ml/`).
- Reviewed `metrics.py`, `evaluate.py`, `model.py`, and `prepare_plantvillage.py` to document current capabilities (EfficientNet-B0, 224x224 input, ImageNet normalization, PlantVillage support).

## Known Gaps
- Target crops (soybean/wheat/chickpea) are completely missing from the evaluation pipeline.
- Actual baseline metric values and run/artifact references have not been verified in this audit; target-crop training/metrics are unavailable.
- Missing metrics tracking for calibration error, model size, latency, and field-image accuracy gap.
- No field images collected; no consent process established.

## Next Actions
- A5: Audit the existing supplied baseline bundle now; obtain provenance/evaluation/model-card evidence from Yashi.
- A6: Finalize the consent/reviewer protocol and exhibition evidence decision; do not collect images without separate authorization.
- Coordinate with Arindam for runtime integration once ONNX artifacts are available.

## Blockers
- **[BLOCKED]** Waiting on target-crop training (Yashi).
- **[UNVERIFIED]** Supplied baseline metadata/metrics have not yet been audited; private artifacts stay outside Git.
- **[BLOCKED]** Waiting on field images for field validation.
- **[BLOCKED]** Agronomist reviewer required for field protocol sign-off.

## Owner integration review — 2026-10-08

Original PR #21 foundation retained with attribution. Twelve scoped unittest cases pass. Passing clean-synthetic and failing missing-input CLI examples return 0/1; valid/invalid manifest examples return 0/1. JSON/CSV output inspected; SHA-256 input preservation and output-under-input rejection verified. Real data/model metrics were not evaluated. git diff --check passed. This is partial A1–A3 delivery; follow-ups A4 manifest/report hardening, A5 supplied-baseline evidence audit and A6 exhibition readiness remain open under #15. No approved model accuracy, artifact readiness or device latency is claimed.
