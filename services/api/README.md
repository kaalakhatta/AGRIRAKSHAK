# AgriRakshak inference API

Stateless FastAPI service that validates a versioned ONNX bundle and runs CPU inference. Uploaded photographs are decoded in memory and are not written to disk or a database.

## Required model bundle

Set `MODEL_BUNDLE_DIR` to a private deployment directory containing:

- `model.onnx`
- `model.onnx.data` (external weights referenced by `model.onnx`)
- `labels.json`
- `metadata.json`
- `metrics.json` (release evidence; not loaded at runtime)

Generate this directory with the exporter documented in `ml/README.md`. Do not commit trained weights or model bundles to Git.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `MODEL_BUNDLE_DIR` | `/app/model` | Absolute path to the evaluated ONNX bundle |
| `MODEL_BUNDLE_URL` | none | HTTPS release URL used only by the deployment build step |
| `ALLOWED_ORIGINS` | production Vercel URL | Comma-separated browser origins allowed by CORS |
| `MAX_IMAGE_BYTES` | `10485760` | Maximum decoded upload size in bytes |
| `PORT` | `8000` | HTTP port used by the container command |

## Local development

Use Python 3.11 or 3.12:

```bash
python3.12 -m venv .venv
.venv/bin/pip install -e '.[dev]'
MODEL_BUNDLE_DIR=/absolute/path/to/model-bundle .venv/bin/uvicorn agrirakshak_api.main:app --reload
```

Without a model bundle, `/health/live` returns 200 while `/health/ready` and `/v1/predict` return 503. This is intentional: the service never fabricates a prediction.

## API

- `GET /health/live` — process health
- `GET /health/ready` — confirms the evaluated model is loaded
- `POST /v1/predict` — multipart form upload under field name `image`
- `GET /docs` — interactive OpenAPI documentation

## Deployment

Build from `services/api/Dockerfile`. On a free CPU host, set the health-check path to `/health/live`, attach the model bundle outside Git, and set `ALLOWED_ORIGINS` to the Vercel production and preview URLs that may call the API.

For a Render native-Python service, use `services/api` as the root directory and configure:

```text
Build command: pip install . && python scripts/install_model_bundle.py
Start command: uvicorn agrirakshak_api.main:app --host 0.0.0.0 --port $PORT
MODEL_BUNDLE_DIR=model
MODEL_BUNDLE_URL=https://.../agrirakshak-baseline-v1.zip
```
