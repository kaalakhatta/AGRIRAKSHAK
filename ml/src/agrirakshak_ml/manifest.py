from __future__ import annotations

import argparse
import hashlib
from collections import Counter
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from .io import write_json, write_jsonl

SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_manifest(root: Path) -> tuple[list[dict], list[dict]]:
    records: list[dict] = []
    rejected: list[dict] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        relative = path.relative_to(root)
        if len(relative.parts) < 2:
            rejected.append({"path": relative.as_posix(), "reason": "not inside a class folder"})
            continue
        try:
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                width, height = image.size
                image_format = image.format or path.suffix.lstrip(".").upper()
        except (OSError, UnidentifiedImageError) as error:
            rejected.append({"path": relative.as_posix(), "reason": f"unreadable: {error}"})
            continue
        records.append(
            {
                "id": hashlib.sha1(relative.as_posix().encode(), usedforsecurity=False).hexdigest(),
                "path": relative.as_posix(),
                "label": relative.parts[0],
                "sha256": file_sha256(path),
                "width": width,
                "height": height,
                "format": image_format,
                "source": "unknown",
                "synthetic": False,
            }
        )
    return records, rejected


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a validated image manifest.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not args.input.is_dir():
        parser.error(f"input directory does not exist: {args.input}")
    records, rejected = build_manifest(args.input)
    if not records:
        parser.error("no valid class-folder images found")
    write_jsonl(args.output, records)
    hashes = Counter(record["sha256"] for record in records)
    write_json(
        args.output.with_suffix(".summary.json"),
        {
            "valid_images": len(records),
            "rejected_images": len(rejected),
            "classes": dict(sorted(Counter(r["label"] for r in records).items())),
            "exact_duplicate_groups": sum(count > 1 for count in hashes.values()),
            "rejected": rejected,
        },
    )
    print(f"Wrote {len(records)} records to {args.output}")


if __name__ == "__main__":
    main()
