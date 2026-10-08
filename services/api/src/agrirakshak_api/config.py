from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _origins(value: str) -> tuple[str, ...]:
    return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    model_bundle_dir: Path
    allowed_origins: tuple[str, ...]
    max_image_bytes: int

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            model_bundle_dir=Path(os.getenv("MODEL_BUNDLE_DIR", "/app/model")),
            allowed_origins=_origins(
                os.getenv("ALLOWED_ORIGINS", "https://agrirakshak-gamma.vercel.app")
            ),
            max_image_bytes=int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024))),
        )
