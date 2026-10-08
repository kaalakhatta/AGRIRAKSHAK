# AgriRakshak delivery roadmap

AgriRakshak now targets an educational farm companion: plan a crop, monitor the season and review recorded outcomes. Disease screening remains a module. Zero paid APIs/subscriptions or mandatory cloud services. Active team: Arindam, Kanika, Yashi, Anushka and Aanya (reassigned 2026-10-08).

The canonical detailed roadmap is [BUILD_PLAN.md](farm-companion/BUILD_PLAN.md). All runtime modules below remain planned until validated. Initial focus: Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. Exhibition date/device and agronomic reviewer remain TBD.

| Milestone | Main outcome | Acceptance |
| --- | --- | --- |
| M0 | Team/repo/contracts and review workflow | Setup merged by human; real /claim works; scope protection configured |
| M1 | Local field/profile/crop-cycle foundation | Location deny/manual/skip, persistence, validated export/import/delete |
| M2 | Weather briefing and explainable action engine | Provider failure isolation, freshness/provenance, reviewed rules only |
| M3 | Seed planning, calendar and scanner timeline | Plan→monitor flow, evidence/missing-input handling, model uncertainty preserved |
| M4 | Soil, expenses, harvests and season review | Unit-safe recorded totals and complete backup round-trip |
| M5 | Exhibition release | Accessibility/offline/device checks, versioned local backup, three rehearsals |

Arindam owns the heavy app/domain/storage/adapters/engine/model/integration/deployment work. Kanika owns farm-data audit/regression fixtures. Yashi owns free Colab training/calibration/evaluation/export and supporting research. Arindam owns all farm intelligence and catalogs. Anushka owns dataset integrity/leakage and model readiness audits. Aanya owns device/accessibility/offline QA and exhibition/rehearsal evidence. Paths and branches remain in [tasks.json](farm-context/tasks.json).

## Preserve the model research track

Continue source/license manifests, reproducible splits, baseline training, calibration and per-class/field-image evaluation. Try conventional augmentation first. Synthetic augmentation only when a documented minority-class problem justifies a controlled experiment; keep synthetic images out of validation/test sets. Store datasets/checkpoints outside Git. No invented metrics or expert approvals.

## Deferred research

Existing-hardware sensors, reviewed translations, soil-report import and advanced offline inference follow a successful first release. Cloud sync, marketplace, market-price feeds and yield-prediction models need separately scoped reliable data and zero-cost feasibility. They do not block the farm companion.
