# Metrics Register

This document outlines all evaluation metrics used in the ML pipeline (`ml/src/agrirakshak_ml/metrics.py` and `evaluate.py`).

## Computed by the Pipeline
- **Per-class precision, recall, F1-score, support**: Measures class-wise performance. High precision means fewer false alarms, high recall means fewer missed diseases.
- **Macro F1, overall accuracy**: Averages performance across classes.
- **Confusion matrix**: Identifies misclassifications between specific diseases.
- **Confidence threshold selection (target precision, coverage)**: Determines the threshold for trusting the model's prediction.
- **Temperature scaling (calibration)**: Fits confidence calibration; calibrated scores still need measured reliability evidence.
- **Test-at-threshold metrics (precision, coverage)**: Performance metrics when the confidence threshold is applied.
- **Per-source evaluation breakdown**: Evaluates performance on different data sources.

## Missing Metrics (To Be Tracked manually or added)
- Expected calibration error (ECE)
- Per-class calibration
- Inference latency
- Model size
- Field-image accuracy gap

## Current Status
- **Actual metric values:** TBD (No training has been run for target crops: soybean, wheat, chickpea).
- Expected ranges and interpretation to be finalized after baseline training.
