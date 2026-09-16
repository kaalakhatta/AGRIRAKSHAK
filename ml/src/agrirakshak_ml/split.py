from __future__ import annotations

import argparse
import random
from collections import defaultdict
from pathlib import Path

from .io import read_jsonl, write_json, write_jsonl


def assign_splits(records: list[dict], seed: int = 130, train_ratio: float = 0.7, val_ratio: float = 0.15) -> list[dict]:
    if not 0 < train_ratio < 1 or not 0 < val_ratio < 1 or train_ratio + val_ratio >= 1:
        raise ValueError("ratios must be positive and sum to less than one")
    labels_by_hash: dict[str, set[str]] = defaultdict(set)
    for record in records:
        labels_by_hash[record["sha256"]].add(record["label"])
    conflicts = {sha: labels for sha, labels in labels_by_hash.items() if len(labels) > 1}
    if conflicts:
        raise ValueError(f"identical files have conflicting labels: {conflicts}")

    grouped: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for record in records:
        grouped[record["label"]][record["sha256"]].append(record)
    assigned: list[dict] = []
    for label in sorted(grouped):
        groups = list(grouped[label].values())
        random.Random(f"{seed}:{label}").shuffle(groups)
        if len(groups) < 3:
            raise ValueError(f"class '{label}' needs at least 3 unique image groups")
        train_end = min(max(1, round(len(groups) * train_ratio)), len(groups) - 2)
        val_end = min(max(train_end + 1, round(len(groups) * (train_ratio + val_ratio))), len(groups) - 1)
        for index, group in enumerate(groups):
            split = "train" if index < train_end else "val" if index < val_end else "test"
            assigned.extend({**record, "split": split, "split_seed": seed} for record in group)
    return sorted(assigned, key=lambda item: item["path"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Create deterministic duplicate-safe splits.")
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=130)
    parser.add_argument("--train-ratio", type=float, default=0.70)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    args = parser.parse_args()
    assigned = assign_splits(read_jsonl(args.manifest), args.seed, args.train_ratio, args.val_ratio)
    write_jsonl(args.output, assigned)
    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for record in assigned:
        counts[record["label"]][record["split"]] += 1
    write_json(args.output.with_suffix(".summary.json"), counts)
    print(f"Wrote split manifest to {args.output}")


if __name__ == "__main__":
    main()
