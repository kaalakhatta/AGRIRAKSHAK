# Model-Evaluation Readiness Checklist

This checklist records available pipeline capabilities, not a completed model-evaluation decision. Checked capability items below do not certify that any supplied bundle was trained, calibrated or evaluated successfully. Actual baseline metrics, manifest/run IDs, exported-output agreement and model-card evidence remain unverified pending A5.
Currently, the pipeline supports PlantVillage crops (pepper, potato, tomato) but lacks support for the target crops (soybean, wheat, chickpea).

## Dataset Documentation
- [ ] TBD: Dataset version (Target crops missing)
- [ ] TBD: Source (Target crops missing)
- [ ] TBD: License (Target crops missing)
- [ ] TBD: Label taxonomy (Target crops missing)
- [ ] Available implementation, evidence unverified: Preprocessing steps (Supported in existing pipeline)

## Split Methodology
- [ ] Available implementation, evidence unverified: Seed (Supported)
- [ ] Available implementation, evidence unverified: Ratios (Supported)
- [ ] TBD: Duplicate handling
- [ ] TBD: Leakage prevention

## Training Documentation
- [ ] Available implementation, evidence unverified: Architecture (EfficientNet-B0)
- [ ] Available implementation, evidence unverified: Hyperparameters
- [ ] Available implementation, evidence unverified: Augmentation
- [ ] TBD: Hardware used for target crops

## Calibration
- [ ] Available implementation, evidence unverified: Temperature scaling (Supported in pipeline)
- [ ] Available implementation, evidence unverified: Threshold selection methodology (Supported in pipeline)

## Evaluation Metrics
- [ ] Available implementation, evidence unverified: Per-class precision/recall/F1 (Supported in metrics.py)
- [ ] Available implementation, evidence unverified: Confusion matrix (Supported in metrics.py)
- [ ] Available implementation, evidence unverified: Macro/weighted averages (Supported in metrics.py)

## Uncertainty Handling
- [ ] Available implementation, evidence unverified: Confidence thresholds
- [ ] TBD: Abstention policy
- [ ] TBD: Unsupported input behavior

## Field Validation
- [BLOCKED] Field validation: controlled-background vs phone/field-image evaluation (Planned separately, waiting on field images)

## Model Export
- [ ] TBD: ONNX conversion (Waiting on target crop training)
- [ ] TBD: Size evaluation
- [ ] TBD: Latency targets evaluation
- [ ] TBD: Browser compatibility check

## Deployment Readiness
- [ ] TBD: Offline inference
- [ ] TBD: Model loading
- [ ] TBD: Error handling

**Gap Analysis:**
- The current pipeline only covers pepper/potato/tomato from PlantVillage. Target crops (soybean/wheat/chickpea) are NOT yet covered.
- Metrics have code support but actual values are TBD pending training on target crops.
