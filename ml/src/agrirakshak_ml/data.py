from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision.transforms import v2

from .io import read_jsonl

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def image_transform(image_size: int, training: bool):
    operations = [v2.ToImage()]
    if training:
        operations.extend(
            [
                v2.RandomResizedCrop((image_size, image_size), scale=(0.72, 1.0)),
                v2.RandomHorizontalFlip(),
                v2.RandomRotation(15),
                v2.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.15),
            ]
        )
    else:
        operations.append(v2.Resize((image_size, image_size)))
    operations.extend([v2.ToDtype(torch.float32, scale=True), v2.Normalize(IMAGENET_MEAN, IMAGENET_STD)])
    return v2.Compose(operations)


class ManifestDataset(Dataset):
    def __init__(self, manifest: Path, data_root: Path, split: str, image_size: int = 224):
        all_records = read_jsonl(manifest)
        self.records = [record for record in all_records if record.get("split") == split]
        self.labels = sorted({record["label"] for record in all_records})
        self.label_to_index = {label: index for index, label in enumerate(self.labels)}
        self.data_root = data_root
        self.transform = image_transform(image_size, training=split == "train")
        if not self.records:
            raise ValueError(f"manifest contains no records for split '{split}'")

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int):
        record = self.records[index]
        with Image.open(self.data_root / record["path"]) as image:
            tensor = self.transform(image.convert("RGB"))
        return tensor, self.label_to_index[record["label"]], record
