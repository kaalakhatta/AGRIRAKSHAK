from __future__ import annotations

import argparse
import hashlib
from collections import Counter, defaultdict
from pathlib import Path

from .io import write_json, write_jsonl

SUPPORTED_CROPS = ("Pepper__bell", "Potato", "Tomato")
UNSUPPORTED_LABEL = "Unsupported___other_plant"


def target_label(source_label: str, include_unsupported: bool) -> str | None:
    if source_label.startswith(tuple(f"{crop}___" for crop in SUPPORTED_CROPS)):
        return source_label
    return UNSUPPORTED_LABEL if include_unsupported else None


def validation_leaf_ids(records: list[dict], seed: int, ratio: float) -> set[str]:
    leaves_by_label: dict[str, set[str]] = defaultdict(set)
    for record in records:
        leaves_by_label[record["target_label"]].add(record["leaf_id"])
    selected: set[str] = set()
    for label, leaves in leaves_by_label.items():
        ranked = sorted(
            leaves,
            key=lambda leaf: hashlib.sha256(f"{seed}:{label}:{leaf}".encode()).hexdigest(),
        )
        count = min(max(1, round(len(ranked) * ratio)), max(1, len(ranked) - 1))
        selected.update(ranked[:count])
    return selected


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download a leakage-aware three-crop PlantVillage training set."
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=130)
    parser.add_argument("--validation-ratio", type=float, default=0.1875)
    parser.add_argument("--max-per-class", type=int, default=1600)
    parser.add_argument("--unsupported-per-source-class", type=int, default=120)
    parser.add_argument("--no-unsupported", action="store_true")
    args = parser.parse_args()
    if not 0 < args.validation_ratio < 0.5:
        parser.error("validation-ratio must be between 0 and 0.5")

    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise SystemExit("Install cloud dependencies with: pip install -e '.[cloud]'") from exc

    dataset = load_dataset("mohanty/PlantVillage", "color")
    include_unsupported = not args.no_unsupported
    selected: dict[str, list[dict]] = {"train": [], "test": []}
    counts: Counter[tuple[str, str]] = Counter()
    for upstream_split in ("train", "test"):
        for index, item in enumerate(dataset[upstream_split]):
            source_label = str(item["label"])
            label = target_label(source_label, include_unsupported)
            if label is None:
                continue
            limit = (
                args.unsupported_per_source_class
                if label == UNSUPPORTED_LABEL
                else args.max_per_class
            )
            key = (upstream_split, source_label)
            if counts[key] >= limit:
                continue
            counts[key] += 1
            selected[upstream_split].append(
                {
                    "image": item["image"],
                    "source_label": source_label,
                    "target_label": label,
                    "leaf_id": str(item["leaf_id"]),
                    "upstream_index": index,
                }
            )

    validation_ids = validation_leaf_ids(selected["train"], args.seed, args.validation_ratio)
    args.output.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    for upstream_split, items in selected.items():
        for item in items:
            split = (
                "test"
                if upstream_split == "test"
                else "val"
                if item["leaf_id"] in validation_ids
                else "train"
            )
            identity = (
                f"{upstream_split}:{item['source_label']}:{item['leaf_id']}:{item['upstream_index']}"
            )
            image_id = hashlib.sha1(identity.encode(), usedforsecurity=False).hexdigest()
            relative = Path(item["target_label"]) / f"{image_id}.jpg"
            destination = args.output / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            image = item["image"].convert("RGB")
            image.save(destination, format="JPEG", quality=95)
            digest = hashlib.sha256(destination.read_bytes()).hexdigest()
            records.append(
                {
                    "id": image_id,
                    "path": relative.as_posix(),
                    "label": item["target_label"],
                    "sha256": digest,
                    "width": image.width,
                    "height": image.height,
                    "format": "JPEG",
                    "source": "mohanty/PlantVillage:color",
                    "source_label": item["source_label"],
                    "leaf_id": item["leaf_id"],
                    "synthetic": False,
                    "split": split,
                    "split_seed": args.seed,
                }
            )

    manifest_path = args.output / "split-manifest.jsonl"
    write_jsonl(manifest_path, sorted(records, key=lambda record: record["path"]))
    summary: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for record in records:
        summary[record["label"]][record["split"]] += 1
    write_json(
        args.output / "split-manifest.summary.json",
        {
            "dataset": "mohanty/PlantVillage",
            "configuration": "color",
            "license": "CC BY-SA 3.0",
            "supported_crops": list(SUPPORTED_CROPS),
            "includes_unsupported_other_plants": include_unsupported,
            "counts": summary,
        },
    )
    print(f"Prepared {len(records)} images and wrote {manifest_path}")


if __name__ == "__main__":
    main()
