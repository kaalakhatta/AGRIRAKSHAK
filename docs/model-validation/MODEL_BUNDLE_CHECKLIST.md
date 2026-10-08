# Model Bundle Readiness Checklist

This checklist is for preparing the final model bundle for deployment.
*Note: Yashi owns training/calibration/evaluation/export; Arindam owns runtime integration.*

## Existing Specifications (From Code)
- **Architecture:** MobileNetV3-Small (NOT EfficientNet-B0)
- **Image size:** 224x224
- **Normalization:** ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
- **Labels:** `Pepper,_bell`, `Potato`, `Tomato`, `Unsupported___other_plant`. *Target crops (soybean/wheat/chickpea) are missing.*

## Export and Verification
- [ ] TBD: ONNX export verification (architecture matches training, operator support). Source/run reference: MISSING.
- [ ] TBD: Model card (architecture, training data, labels, limitations, intended use). Artifact reference: MISSING.

## Size and Latency Targets
- [ ] TBD: Size budget (budget TBD; record actual artifact size and owner-approved device budget). NOTE: Do not invent size budget.
- [ ] TBD: Latency targets (targets TBD; Aanya supplies observed timings with device/browser/build evidence). NOTE: Do not invent latency targets.
- [ ] TBD: Accuracy claims and reviewer approval are currently unverified and must not be invented.

## Runtime Integration
- [ ] TBD: Label mapping (model output indices to human-readable disease names)
- [ ] TBD: Confidence policy (threshold, abstention message, uncertainty display)
- [ ] TBD: Browser compatibility (ONNX Runtime Web, WebAssembly backend)
- [ ] TBD: Offline support (model caching via service worker)
- [ ] TBD: Version manifest (model version, training date, dataset version, evaluation date)

## Overall Status
- Target crops (soybean/wheat/chickpea): no supporting evaluated artifacts have been supplied to this audit.
- A supplied pepper/potato/tomato baseline bundle can be audited independently now; target-crop training is not a prerequisite for that evidence audit. Target-crop and field-image coverage remain unverified.
