# Architecture

## Runtime design

The deployed system uses a hosted inference API and managed content database:

```text
phone camera or upload
      |
Vercel Next.js application
      |
protected prediction route
      |
FastAPI + ONNX Runtime CPU service
      |
calibrated prediction and uncertainty policy
      |
Supabase disease catalog and anonymous scan metadata
      |
result, safety guidance, and quiz
```

The application does not store leaf photographs by default. The database records only the model version, predicted class, confidence, uncertainty state, timestamp, and optional user feedback. A bundled browser model may be added later as an offline fallback.

## Model contract

The inference service will accept a versioned bundle containing:

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

- Vercel hosts the Next.js application and its server-side proxy route.
- A free CPU web service hosts the Dockerized FastAPI inference API.
- Supabase hosts PostgreSQL content and scan metadata with row-level security.
- Secrets remain server-side in hosting environment variables.
- Free services may sleep when inactive, so the exhibition checklist includes a health check before the live demonstration.
