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

## 005: expand to a local-first farm companion

**Status:** accepted product direction; implementation pending (2026-10-05).

Plan, monitor and review a crop cycle. Disease screening stays independent. Add field/cycle profiles, weather, reviewed rules, calendars, measured soil entries and expense/harvest records. Use IndexedDB with export/import/delete; no mandatory accounts or hosted database. Precise location remains transient unless explicitly saved locally. This extends decision 002's local-storage intent. The architecture document supersedes the earlier hosted-only design; inference mode still needs measured feasibility before switching.

## 006: hard zero-paid-service budget

**Status:** accepted constraint (2026-10-05).

No paid APIs/subscriptions, card-required dependencies, paid AI endpoints or mandatory new hardware. Open-Meteo is a candidate within its free non-commercial terms. Cache conservatively and show missing data if free service access fails. SoilGrids REST is paused and its maps are not field measurements; prefer manual measured soil entries. Always retain a local build/distribution path. No automatic paid fallback.

## 007: reviewed rules before recommendation ML

**Status:** accepted first-release approach.

Use a deterministic declarative rule engine and region/crop/stage evidence catalog with review gates. Explain inputs, reasons, data age and missing information. Broad topics do not imply nationwide coverage. No agricultural threshold, yield increase or model result can be invented. Further recommendation ML needs reliable measured outcomes and separate justification.
