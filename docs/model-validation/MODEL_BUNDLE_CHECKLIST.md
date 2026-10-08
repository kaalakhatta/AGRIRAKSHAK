# Model Bundle Readiness Checklist

This checklist is for preparing the final model bundle for deployment.
*Note: Yashi owns training/calibration/evaluation/export; Arindam owns runtime integration.*

## Existing Specifications (From Code)
- **Architecture:** EfficientNet-B0 (from `model.py`)
- **Image size:** 224x224
- **Normalization:** ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
- **Labels:** pepper/potato/tomato diseases (from `prepare_plantvillage.py`). *Target crops (soybean/wheat/chickpea) are missing.*

## Export and Verification
- [ ] TBD: ONNX export verification (architecture matches training, operator support)
- [ ] TBD: Model card (architecture, training data, labels, limitations, intended use)

## Size and Latency Targets
- [ ] TBD: Size budget (target < 20MB for mobile browser inference)
- [ ] TBD: Latency targets (< 2s inference on mid-range phone browser)

## Runtime Integration
- [ ] TBD: Label mapping (model output indices to human-readable disease names)
- [ ] TBD: Confidence policy (threshold, abstention message, uncertainty display)
- [ ] TBD: Browser compatibility (ONNX Runtime Web, WebAssembly backend)
- [ ] TBD: Offline support (model caching via service worker)
- [ ] TBD: Version manifest (model version, training date, dataset version, evaluation date)

## Overall Status
- Target crops (soybean/wheat/chickpea): NO model artifacts exist.
- [BLOCKED] Model export and bundle creation waiting on target-crop training.
