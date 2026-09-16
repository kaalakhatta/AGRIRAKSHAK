# Machine learning workspace

The training workspace will contain reproducible notebooks and importable Python modules for dataset validation, stratified splitting, baseline training, evaluation, calibration, ONNX export, and the augmentation experiment.

Do not add raw datasets or large checkpoints to Git. Record image sources and licenses in a manifest before training.

## Required experiment outputs

- immutable class list and split manifest
- overall and per-class precision, recall, and F1
- confusion matrix
- field-photo subset results
- calibration plot and selected uncertainty threshold
- model size and browser latency
- baseline-versus-augmentation comparison on the same real test set
