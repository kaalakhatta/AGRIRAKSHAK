# Baseline Model Audit

This document presents an audit of the existing `Pepper,_bell`, `Potato`, and `Tomato` model handoff against the runtime contract.

## Scope & Labels
- **Model Architecture:** MobileNetV3-Small (NOT EfficientNet-B0)
- **Supported Crops (Baseline):** `Pepper,_bell`, `Potato`, `Tomato`, plus `Unsupported___other_plant`.
- **Target Crops:** Soybean, Wheat, Chickpea.
- **Gap:** Target crops are currently **unverified** and not present in the baseline bundle.

## Preprocessing & Contract
- **Input Dimensions:** 224x224
- **Normalization:** ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
- **Uncertainty Policy:** Confidence threshold selection and temperature scaling have been outlined, but actual policy verification and abstention handling against the runtime contract remains **unverified**.

## Metrics & Provenance
- **Source-Reported vs. Verified:** We must distinguish source-reported metrics from independently verified project results. At this time, real source-reported baseline metrics are awaiting formal review, and independent verification has not been performed.
- **Target Crops:** Metrics for soybean, wheat, and chickpea are **unverified**.

## Artifact Verification
- **Missing Tensor/Export Verification:** ONNX export integrity, tensor shapes, and operator support are currently **unverified**.
