from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import Settings
from .model import BundleError, InvalidImageError, ModelBundle, Prediction

logger = logging.getLogger(__name__)
settings = Settings.from_environment()


class PredictionResponse(BaseModel):
    label: str
    crop: str
    condition: str
    confidence: float
    uncertain: bool
    uncertainty_threshold: float
    model_version: str
    top_predictions: list[dict[str, float | str]]


class RuntimeState:
    bundle: ModelBundle | None = None
    model_error: str | None = None


runtime = RuntimeState()


def load_model() -> None:
    try:
        runtime.bundle = ModelBundle(settings.model_bundle_dir)
        runtime.model_error = None
        logger.info("loaded model bundle %s", runtime.bundle.metadata["modelVersion"])
    except (BundleError, OSError, ValueError) as exc:
        runtime.bundle = None
        runtime.model_error = str(exc)
        logger.warning("model unavailable: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="AgriRakshak Inference API",
    version="0.1.0",
    description="Stateless preliminary crop-disease image screening with a reviewed ONNX model.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "agrirakshak-api", "docs": "/docs", "health": "/health/live"}


@app.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def ready() -> dict[str, str]:
    if runtime.bundle is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The evaluated model bundle has not been installed.",
        )
    return {"status": "ready", "model_version": str(runtime.bundle.metadata["modelVersion"])}


@app.post("/v1/predict", response_model=PredictionResponse)
async def predict(request: Request, image: Annotated[UploadFile, File()]) -> PredictionResponse:
    if runtime.bundle is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The evaluated model bundle has not been installed.",
        )
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WebP image.")
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_image_bytes + 1_000_000:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    image_bytes = await image.read(settings.max_image_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_bytes) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    try:
        result: Prediction = runtime.bundle.predict(image_bytes)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BundleError as exc:
        logger.exception("model bundle failed during prediction")
        raise HTTPException(status_code=503, detail="The model is temporarily unavailable.") from exc
    return PredictionResponse(
        label=result.label,
        crop=result.crop,
        condition=result.condition,
        confidence=result.confidence,
        uncertain=result.uncertain,
        uncertainty_threshold=result.threshold,
        model_version=result.model_version,
        top_predictions=result.top_predictions,
    )
