# Model-Evaluation Readiness Checklist

This checklist documents the readiness of the model evaluation pipeline.
Currently, the pipeline supports PlantVillage crops (pepper, potato, tomato) but lacks support for the target crops (soybean, wheat, chickpea).

## Dataset Documentation
- [ ] TBD: Dataset version (Target crops missing)
- [ ] TBD: Source (Target crops missing)
- [ ] TBD: License (Target crops missing)
- [ ] TBD: Label taxonomy (Target crops missing)
- [x] Done: Preprocessing steps (Supported in existing pipeline)

## Split Methodology
- [x] Done: Seed (Supported)
- [x] Done: Ratios (Supported)
- [ ] TBD: Duplicate handling
- [ ] TBD: Leakage prevention

## Training Documentation
- [x] Done: Architecture (EfficientNet-B0)
- [x] Done: Hyperparameters
- [x] Done: Augmentation
- [ ] TBD: Hardware used for target crops

## Calibration
- [x] Done: Temperature scaling (Supported in pipeline)
- [x] Done: Threshold selection methodology (Supported in pipeline)

## Evaluation Metrics
- [x] Done: Per-class precision/recall/F1 (Supported in metrics.py)
- [x] Done: Confusion matrix (Supported in metrics.py)
- [x] Done: Macro/weighted averages (Supported in metrics.py)

## Uncertainty Handling
- [x] Done: Confidence thresholds
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
