from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, WeightedRandomSampler

from .data import ManifestDataset
from .metrics import classification_report
from .model import build_model


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def choose_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def run_epoch(model, loader, loss_fn, device, optimizer=None) -> tuple[float, list[int], list[int]]:
    training = optimizer is not None
    model.train(training)
    total_loss, targets, predictions = 0.0, [], []
    for images, labels, _ in loader:
        images, labels = images.to(device), labels.to(device)
        if training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            logits = model(images)
            loss = loss_fn(logits, labels)
            if training:
                loss.backward()
                optimizer.step()
        total_loss += loss.item() * images.size(0)
        targets.extend(labels.detach().cpu().tolist())
        predictions.extend(logits.argmax(dim=1).detach().cpu().tolist())
    return total_loss / len(loader.dataset), targets, predictions


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the AgriRakshak baseline classifier.")
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--seed", type=int, default=130)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--freeze-features", action="store_true")
    parser.add_argument("--class-balanced", action="store_true")
    args = parser.parse_args()

    seed_everything(args.seed)
    device = choose_device()
    train_data = ManifestDataset(args.manifest, args.data_root, "train", args.image_size)
    val_data = ManifestDataset(args.manifest, args.data_root, "val", args.image_size)
    generator = torch.Generator().manual_seed(args.seed)
    sampler = None
    if args.class_balanced:
        class_counts = np.bincount(
            [train_data.label_to_index[record["label"]] for record in train_data.records],
            minlength=len(train_data.labels),
        )
        sample_weights = [
            1.0 / class_counts[train_data.label_to_index[record["label"]]]
            for record in train_data.records
        ]
        sampler = WeightedRandomSampler(
            sample_weights, num_samples=len(sample_weights), replacement=True, generator=generator
        )
    train_loader = DataLoader(
        train_data,
        batch_size=args.batch_size,
        shuffle=sampler is None,
        sampler=sampler,
        num_workers=args.workers,
        generator=generator,
    )
    val_loader = DataLoader(val_data, batch_size=args.batch_size, shuffle=False, num_workers=args.workers)
    model = build_model(len(train_data.labels), pretrained=True, freeze_features=args.freeze_features).to(device)
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=args.learning_rate, weight_decay=1e-4)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.05)
    args.output.mkdir(parents=True, exist_ok=True)
    manifest_sha256 = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    history, best_f1 = [], -1.0

    for epoch in range(1, args.epochs + 1):
        train_loss, train_targets, train_predictions = run_epoch(model, train_loader, loss_fn, device, optimizer)
        val_loss, val_targets, val_predictions = run_epoch(model, val_loader, loss_fn, device)
        train_report = classification_report(train_targets, train_predictions, train_data.labels)
        val_report = classification_report(val_targets, val_predictions, val_data.labels)
        entry = {"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss, "train_macro_f1": train_report["macro_f1"], "val_macro_f1": val_report["macro_f1"]}
        history.append(entry)
        print(json.dumps(entry))
        if val_report["macro_f1"] > best_f1:
            best_f1 = val_report["macro_f1"]
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "labels": train_data.labels,
                    "architecture": "mobilenet_v3_small",
                    "image_size": args.image_size,
                    "seed": args.seed,
                    "manifest_sha256": manifest_sha256,
                    "best_val_macro_f1": best_f1,
                },
                args.output / "best.pt",
            )
    (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n", encoding="utf-8")
    print(f"Best validation macro F1: {best_f1:.4f}; device: {device}")


if __name__ == "__main__":
    main()
