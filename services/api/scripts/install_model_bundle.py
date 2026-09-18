from __future__ import annotations

import os
import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path

MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
REQUIRED_FILES = {
    "labels.json",
    "metadata.json",
    "metrics.json",
    "model.onnx",
    "model.onnx.data",
}


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "AgriRakshak-model-installer/1"})
    with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > MAX_ARCHIVE_BYTES:
            raise RuntimeError("model bundle archive exceeds the 64 MB limit")
        shutil.copyfileobj(response, output, length=1024 * 1024)
    if destination.stat().st_size > MAX_ARCHIVE_BYTES:
        raise RuntimeError("model bundle archive exceeds the 64 MB limit")


def install(archive: Path, target: Path) -> None:
    with zipfile.ZipFile(archive) as bundle:
        archive_files = {Path(name).as_posix() for name in bundle.namelist() if not name.endswith("/")}
        if not REQUIRED_FILES.issubset(archive_files):
            missing = sorted(REQUIRED_FILES - archive_files)
            raise RuntimeError(f"model bundle is missing: {', '.join(missing)}")
        unexpected_paths = [name for name in archive_files if Path(name).name != name]
        if unexpected_paths:
            raise RuntimeError("model bundle files must be stored at the ZIP root")
        target.mkdir(parents=True, exist_ok=True)
        for name in sorted(REQUIRED_FILES):
            with bundle.open(name) as source, (target / name).open("wb") as output:
                shutil.copyfileobj(source, output)


def main() -> None:
    url = os.environ.get("MODEL_BUNDLE_URL", "").strip()
    if not url.startswith("https://"):
        raise RuntimeError("MODEL_BUNDLE_URL must be an HTTPS URL")
    target = Path(os.environ.get("MODEL_BUNDLE_DIR", "model"))
    with tempfile.TemporaryDirectory(prefix="agrirakshak-model-") as temporary_directory:
        archive = Path(temporary_directory) / "bundle.zip"
        download(url, archive)
        install(archive, target)
    print(f"Installed evaluated model bundle in {target.resolve()}")


if __name__ == "__main__":
    main()
