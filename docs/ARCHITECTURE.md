# Architecture

## Runtime design

The browser owns the exhibition-critical path:

```text
camera or upload
      |
image validation and preprocessing
      |
ONNX Runtime Web classifier
      |
confidence policy and label map
      |
reviewed local disease catalog
      |
result, safety guidance, and quiz
```

This design removes a paid model API, database, and authentication service from the MVP. Static assets can be cached by a service worker, so a previously loaded build remains usable during network problems.

## Model contract

The web app will accept a versioned bundle under `apps/web/public/models/<version>/` containing:

- `model.onnx`
- `labels.json`
- `metadata.json` with input dimensions, normalization, model version, dataset version, confidence threshold, and metrics-report path

The UI must never infer preprocessing values from the model filename.

## Data boundaries

- Public dataset images are not committed to Git.
- `ml/data/` stays ignored except for manifests and small, license-safe samples.
- Test images remain real images and never include generated samples.
- Content entries include reviewer status and sources.
- User photos stay on the device in the MVP.

## Confidence policy

A softmax score is not diagnostic certainty. Before release, the team will select a threshold using validation data and calibration analysis. Results below that threshold must say that the model is unsure and suggest a clearer photo or expert review.

## Deployment

The primary target is Vercel’s free tier. A static-export-compatible app and a tagged local release provide backups. No secret is required for the core demo.
