from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import onnx
import onnxruntime as ort
import torch

from .data import IMAGENET_MEAN, IMAGENET_STD
from .io import write_json
from .model import build_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Export a tested browser model bundle.")
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--version", default="baseline-v1")
    args = parser.parse_args()

    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    evaluation = json.loads(args.evaluation.read_text(encoding="utf-8"))
    model = build_model(len(checkpoint["labels"]), pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    args.output.mkdir(parents=True, exist_ok=True)
    model_path = args.output / "model.onnx"
    dummy = torch.zeros(1, 3, checkpoint["image_size"], checkpoint["image_size"])
    torch.onnx.export(model, dummy, model_path, input_names=["image"], output_names=["logits"], opset_version=18, dynamo=True)
    onnx.checker.check_model(onnx.load(model_path))
    session = ort.InferenceSession(model_path.as_posix(), providers=["CPUExecutionProvider"])
    output = session.run(None, {"image": dummy.numpy()})[0]
    if output.shape != (1, len(checkpoint["labels"])):
        raise RuntimeError(f"unexpected ONNX output shape: {output.shape}")
    write_json(args.output / "labels.json", checkpoint["labels"])
    write_json(
        args.output / "metadata.json",
        {
            "schemaVersion": 1,
            "modelVersion": args.version,
            "architecture": checkpoint["architecture"],
            "datasetManifestSha256": checkpoint["manifest_sha256"],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "input": {"name": "image", "layout": "NCHW", "shape": [1, 3, checkpoint["image_size"], checkpoint["image_size"]], "colorSpace": "RGB", "resize": "stretch", "scale": 1 / 255, "mean": IMAGENET_MEAN, "std": IMAGENET_STD},
            "output": {"name": "logits", "activation": "softmax", "temperature": evaluation["temperature"]},
            "uncertaintyThreshold": evaluation["confidence_policy"]["threshold"],
            "labelsFile": "labels.json",
            "modelFile": "model.onnx",
            "metricsFile": "metrics.json",
        },
    )
    shutil.copy2(args.evaluation, args.output / "metrics.json")
    print(f"Validated ONNX bundle written to {args.output}")


if __name__ == "__main__":
    main()
