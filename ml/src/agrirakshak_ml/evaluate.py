from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader

from .data import ManifestDataset
from .io import write_json
from .metrics import classification_report, select_confidence_threshold
from .model import build_model


def collect_logits(model, loader, device):
    logits, targets, records = [], [], []
    model.eval()
    with torch.inference_mode():
        for images, labels, batch_records in loader:
            logits.append(model(images.to(device)).cpu())
            targets.append(labels)
            records.extend([{key: batch_records[key][i] for key in batch_records} for i in range(len(labels))])
    return torch.cat(logits), torch.cat(targets), records


def fit_temperature(logits: torch.Tensor, targets: torch.Tensor) -> float:
    log_temperature = nn.Parameter(torch.zeros(1))
    optimizer = torch.optim.LBFGS([log_temperature], lr=0.05, max_iter=50)
    loss_fn = nn.CrossEntropyLoss()

    def closure():
        optimizer.zero_grad()
        loss = loss_fn(logits / log_temperature.exp().clamp_min(0.05), targets)
        loss.backward()
        return loss

    optimizer.step(closure)
    return float(log_temperature.exp().detach().clamp(0.05, 10.0))


def report_for(logits: torch.Tensor, targets: torch.Tensor, labels: list[str], temperature: float) -> tuple[dict, list[float], list[bool]]:
    probabilities = torch.softmax(logits / temperature, dim=1)
    confidences, predictions = probabilities.max(dim=1)
    report = classification_report(targets.tolist(), predictions.tolist(), labels)
    return report, confidences.tolist(), predictions.eq(targets).tolist()


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate and calibrate a trained classifier.")
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--target-precision", type=float, default=0.85)
    args = parser.parse_args()

    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(len(checkpoint["labels"]), pretrained=False).to(device)
    model.load_state_dict(checkpoint["state_dict"])
    datasets = {split: ManifestDataset(args.manifest, args.data_root, split, checkpoint["image_size"]) for split in ("val", "test")}
    val_logits, val_targets, _ = collect_logits(model, DataLoader(datasets["val"], batch_size=args.batch_size, num_workers=args.workers), device)
    temperature = fit_temperature(val_logits, val_targets)
    val_report, val_confidence, val_correct = report_for(val_logits, val_targets, checkpoint["labels"], temperature)
    threshold = select_confidence_threshold(val_confidence, val_correct, args.target_precision)
    test_logits, test_targets, test_records = collect_logits(model, DataLoader(datasets["test"], batch_size=args.batch_size, num_workers=args.workers), device)
    test_report, test_confidence, test_correct = report_for(test_logits, test_targets, checkpoint["labels"], temperature)

    by_source: dict[str, list[int]] = defaultdict(list)
    for index, record in enumerate(test_records):
        by_source[str(record.get("source", "unknown"))].append(index)
    source_reports = {}
    test_predictions = (test_logits / temperature).argmax(dim=1).tolist()
    for source, indexes in by_source.items():
        source_reports[source] = classification_report([test_targets[i].item() for i in indexes], [test_predictions[i] for i in indexes], checkpoint["labels"])

    metrics = {
        "architecture": checkpoint["architecture"],
        "labels": checkpoint["labels"],
        "image_size": checkpoint["image_size"],
        "temperature": temperature,
        "confidence_policy": threshold,
        "validation": val_report,
        "test": test_report,
        "test_at_threshold": {
            "precision": sum(ok for conf, ok in zip(test_confidence, test_correct, strict=True) if conf >= threshold["threshold"]) / max(1, sum(conf >= threshold["threshold"] for conf in test_confidence)),
            "coverage": sum(conf >= threshold["threshold"] for conf in test_confidence) / len(test_confidence),
        },
        "test_by_source": source_reports,
    }
    write_json(args.output / "metrics.json", metrics)
    print(json.dumps({"test_accuracy": test_report["accuracy"], "test_macro_f1": test_report["macro_f1"], "temperature": temperature, **threshold}, indent=2))


if __name__ == "__main__":
    main()
