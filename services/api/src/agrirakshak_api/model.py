from __future__ import annotations

import json
import math
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from PIL import Image, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 25_000_000


class BundleError(RuntimeError):
    """Raised when the versioned model bundle is incomplete or inconsistent."""


class InvalidImageError(ValueError):
    """Raised when an uploaded file cannot safely be decoded as a supported image."""


@dataclass(frozen=True)
class Prediction:
    label: str
    crop: str
    condition: str
    confidence: float
    uncertain: bool
    threshold: float
    model_version: str
    top_predictions: list[dict[str, float | str]]


def split_label(label: str) -> tuple[str, str]:
    for separator in ("___", "__", ":", "/"):
        if separator in label:
            crop, condition = label.split(separator, 1)
            return crop.replace("_", " ").strip(), condition.replace("_", " ").strip()
    return "Unknown crop", label.replace("_", " ").strip()


def softmax(logits: np.ndarray, temperature: float) -> np.ndarray:
    if not math.isfinite(temperature) or temperature <= 0:
        raise BundleError("metadata output.temperature must be greater than zero")
    scaled = np.asarray(logits, dtype=np.float64) / temperature
    scaled -= np.max(scaled)
    probabilities = np.exp(scaled)
    return probabilities / probabilities.sum()


class ModelBundle:
    def __init__(self, bundle_dir: Path):
        metadata_path = bundle_dir / "metadata.json"
        labels_path = bundle_dir / "labels.json"
        model_path = bundle_dir / "model.onnx"
        missing = [path.name for path in (metadata_path, labels_path, model_path) if not path.is_file()]
        if missing:
            raise BundleError(f"model bundle is missing: {', '.join(missing)}")

        self.metadata: dict[str, Any] = json.loads(metadata_path.read_text(encoding="utf-8"))
        labels = json.loads(labels_path.read_text(encoding="utf-8"))
        if not isinstance(labels, list) or not labels or not all(isinstance(item, str) for item in labels):
            raise BundleError("labels.json must be a non-empty array of strings")
        self.labels: list[str] = labels
        self._validate_metadata()
        self.session = ort.InferenceSession(
            model_path.as_posix(), providers=["CPUExecutionProvider"]
        )

    def _validate_metadata(self) -> None:
        try:
            input_config = self.metadata["input"]
            shape = input_config["shape"]
            if input_config["layout"] != "NCHW" or len(shape) != 4 or shape[:2] != [1, 3]:
                raise BundleError("only a fixed [1, 3, height, width] NCHW input is supported")
            if len(input_config["mean"]) != 3 or len(input_config["std"]) != 3:
                raise BundleError("metadata input mean and std must contain three values")
            float(self.metadata["output"]["temperature"])
            float(self.metadata["uncertaintyThreshold"])
            str(self.metadata["modelVersion"])
        except (KeyError, TypeError, ValueError) as exc:
            raise BundleError("metadata.json does not match schema version 1") from exc

    def _preprocess(self, image_bytes: bytes) -> np.ndarray:
        try:
            with Image.open(BytesIO(image_bytes)) as source:
                source.verify()
            with Image.open(BytesIO(image_bytes)) as source:
                image = source.convert("RGB")
                _, _, height, width = self.metadata["input"]["shape"]
                image = image.resize((width, height), Image.Resampling.BILINEAR)
                array = np.asarray(image, dtype=np.float32)
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise InvalidImageError("file is not a valid JPG, PNG, or WebP image") from exc

        scale = float(self.metadata["input"]["scale"])
        mean = np.asarray(self.metadata["input"]["mean"], dtype=np.float32)
        std = np.asarray(self.metadata["input"]["std"], dtype=np.float32)
        if np.any(std == 0):
            raise BundleError("metadata input std values must be non-zero")
        array = (array * scale - mean) / std
        return np.transpose(array, (2, 0, 1))[np.newaxis, ...].astype(np.float32)

    def predict(self, image_bytes: bytes) -> Prediction:
        tensor = self._preprocess(image_bytes)
        input_name = str(self.metadata["input"]["name"])
        output_name = str(self.metadata["output"]["name"])
        logits = np.asarray(self.session.run([output_name], {input_name: tensor})[0]).squeeze()
        if logits.ndim != 1 or logits.shape[0] != len(self.labels):
            raise BundleError("model output size does not match labels.json")

        probabilities = softmax(logits, float(self.metadata["output"]["temperature"]))
        ranked = np.argsort(probabilities)[::-1]
        best_index = int(ranked[0])
        label = self.labels[best_index]
        confidence = float(probabilities[best_index])
        threshold = float(self.metadata["uncertaintyThreshold"])
        crop, condition = split_label(label)
        return Prediction(
            label=label,
            crop=crop,
            condition=condition,
            confidence=confidence,
            uncertain=confidence < threshold,
            threshold=threshold,
            model_version=str(self.metadata["modelVersion"]),
            top_predictions=[
                {"label": self.labels[int(index)], "confidence": float(probabilities[int(index)])}
                for index in ranked[:3]
            ],
        )

