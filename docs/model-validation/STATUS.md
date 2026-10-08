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
- No actual metric values exist since training on target crops has not occurred.
- Missing metrics tracking for calibration error, model size, latency, and field-image accuracy gap.
- No field images collected; no consent process established.

## Next Actions
- Wait for target-crop training to be completed by Yashi.
- Establish the field image collection protocol and begin data collection.
- Coordinate with Arindam for runtime integration once ONNX artifacts are available.

## Blockers
- **[BLOCKED]** Waiting on target-crop training (Yashi).
- **[BLOCKED]** Missing model artifacts for bundle evaluation.
- **[BLOCKED]** Waiting on field images for field validation.
- **[BLOCKED]** Agronomist reviewer required for field protocol sign-off.
