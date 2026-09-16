# Technical decisions

## 001: browser inference for the MVP

**Status:** accepted

Use ONNX Runtime Web for model inference. This keeps operating cost at zero, avoids uploading farmers’ images, and makes offline exhibition use possible. Revisit server inference only if the final model cannot meet browser size or latency targets.

## 002: no accounts or database in the MVP

**Status:** accepted

Store educational progress locally. Authentication, managed storage, and social features remain optional because they add demo risk without proving the central idea.

## 003: evidence before generative augmentation

**Status:** accepted

Measure a baseline with conventional augmentation first. Introduce a GAN or another generator only for a documented class-imbalance problem, and judge it by performance on untouched real images.

## 004: safety language is part of the product

**Status:** accepted

Use preliminary-screening language, low-confidence handling, and reviewed educational guidance. Do not generate pesticide names or dosages dynamically.
