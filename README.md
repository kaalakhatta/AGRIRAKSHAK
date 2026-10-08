# AgriRakshak

**Teammate agents: read [START_HERE.md](START_HERE.md) before edits. Setup and the five-person roster are merged; follow the current registered scopes.**

AgriRakshak is a college exhibition farm companion planned to help farmers plan crops, monitor a growing season and review their records. Preliminary leaf-disease screening is one part of the product.

[Open the existing web prototype](https://agrirakshak-gamma.vercel.app). The full companion described here is planned work, not a claim that all features are deployed.

## Product direction

- My Farm: confirmed field location, crop cycle and water access
- Today: free weather context, due tasks and explainable reviewed guidance
- Plan: regional seed/crop candidates and stage-based crop calendar
- Scan: preliminary disease screening, uncertainty and optional crop timeline
- Records: measured soil entries, observations, expenses, harvests and season summaries

No guaranteed yield increases, professional diagnoses or pesticide/fertilizer prescriptions. Recommendations require applicable reviewed evidence; missing data stays missing. GPS does not measure soil nutrients. Weather estimates are not actual field sensors.

Initial focus is Sehore, Madhya Pradesh, for soybean, wheat and gram/chickpea. Agronomy reviewer remains TBD; selected planning coverage does not establish disease-model coverage.

## Zero-paid-service build

Keep Next.js/TypeScript and the existing scanner work. Use local browser storage for farm records, versioned reviewed content, and a deterministic rule engine. No mandatory accounts, hosted database, paid AI, subscription APIs or card-required services. Optional weather enrichment uses eligible free access with cache/failure labels; a local runnable build is always required. Sensor hardware and external inference are not assumed available. Model unavailability never produces a fabricated result.

## Exhibition candidate — October 9, 2026

Home now presents Plan → Monitor → Improve and a one-click labelled Sehore sample farm; the supporting scanner is at `/scan`. Prepare the six-screen offline app once while connected and export/check a coordinate-free backup. The local baseline scanner covers bell pepper, potato and tomato, not the companion’s soybean/wheat/chickpea focus. Real inference requires the configured model server and image-sharing consent; the interface demo is explicit and labelled.

Start the prepared local build with `npm run exhibition` and open http://127.0.0.1:3000. See [exhibition runbook](docs/farm-companion/EXHIBITION_RUNBOOK.md) and [M5 validation and gaps](docs/farm-companion/M5_EXHIBITION.md). Private model artifacts stay outside Git; no paid service is required. Human-reviewed agronomic catalogs, field/target-crop model validation and actual presentation-device camera/download checks remain pending.

## Current core milestone

The new `/farm` screen implements local field/crop-cycle records, confirmed optional location, and backup/import/delete controls. Open `/farm` to manage records and `/today` for a selected field’s overview. M2 adds opt-in Open-Meteo weather, session caching/failure handling, information prompts and a tested declarative recommendation evaluator. M3 adds `/plan` personal season reminders, completion tracking and confirmed sowing-date rescheduling. The scanner can explicitly save a labelled demonstration summary to `/records` without retaining a photo, location or simulated confidence. Records now also includes a local soil notebook: manually enter pH, organic carbon, sand and clay with sample date, source, optional depth and method. Edit/delete tests and view field-specific soil preparation prompts on Today. Old farm backups remain importable; schema-8 backups include reminders, summaries, soil tests, expenses, harvests, sales, observations and step feedback. Records also provides per-cycle expense/refund totals in INR and separate harvest weight/count totals, with optional per-picking kg/ha when harvested area is recorded. Today now saves done, snoozed, not-applicable and needs-help responses with notes. Saved follow-ups remain local; changed input contexts need a fresh review and calendar tasks stay managed in Plan. See [feedback validation](docs/farm-companion/M3_FEEDBACK.md). Observations keep dated plain-text field notes and descriptive tags per cycle, with optional same-cycle screening references, editing and tag filtering. Demo-linked notes stay synthetic. Season review shows observation coverage without inferring crop health. See [observation validation](docs/farm-companion/M4_OBSERVATIONS.md). Sales record quantities sold and cash actually received. Season review compares recorded receipts, net outlay and matching weight/count totals, with missing-data notices and separate synthetic totals. This does not infer profit or available stock. See [sales and season review validation](docs/farm-companion/M4_SEASON_REVIEW.md). See [expense and harvest validation](docs/farm-companion/M4_SEASON_RECORDS.md). See [soil notebook validation](docs/farm-companion/M4_SOIL.md). See [timeline validation](docs/farm-companion/M3_TIMELINE.md). Plan now includes separate seed-comparison and crop-schedule preview sections, backed by the planning-1 validator and field/cycle/review/input checks. Content remains unavailable pending genuine agronomy review; previews preserve personal reminders. See [planning framework validation](docs/farm-companion/M3_PLANNING.md). Runtime agricultural advice remains unavailable until reviewed catalogs arrive. See [M3 calendar validation](docs/farm-companion/M3_CALENDAR.md). See [M2 contracts and validation](docs/farm-companion/M2_CONTRACT.md). See [M1 validation](docs/farm-companion/M1_VALIDATION.md) and [core status](docs/farm-context/CORE_STATUS.md) for observed checks and pending device QA.

## Build plan and team

Read [full build plan](docs/farm-companion/BUILD_PLAN.md), [architecture](docs/ARCHITECTURE.md), [data model](docs/farm-companion/DATA_MODEL.md), [engine plan](docs/farm-companion/RECOMMENDATION_ENGINE.md) and [repository/delivery protocol](docs/farm-companion/DELIVERY.md).

Arindam owns the main farm intelligence, catalogs and runtime integration (Task 10/#11), Kanika farm-data validation/regression (Task 6/#9), Yashi free Colab training/evaluation/export and supporting research (Task 7/#10), Anushka dataset/model audits (Task 11/#15), and Aanya device QA/exhibition readiness (Task 12/#16). Agents read [AGENTS.md](AGENTS.md), their complete brief and [task registry](docs/farm-context/tasks.json), then use the [/claim workflow](CONTRIBUTING.md). Setup #12, roster #17 and Task 7 training scopes #18 are merged into main; the current registered scopes apply. Historical deliverables and open PRs are preserved. Find your active issue and full brief in the [team task index](docs/team-tasks/README.md). Anushka’s assignment is [Task 11 / issue #15](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/15), with the [complete dataset/model audit brief](docs/team-tasks/TASK-11-MODEL-AUDIT.md).

## Repository

```text
apps/web/                         Existing application; planned feature modules
ml/                              Existing model work; independent context audit
services/                        Local artifacts, not approved model Git storage
data/catalog/farm-context/        Content schemas, evidence-backed catalog and drafts
docs/farm-companion/              Full build, data, engine and delivery plans
docs/research/farm-context/       Evidence/provider research
docs/exhibition/farm-context/     QA/demo/release evidence
.github/                         CI, /claim and task scope checks
```

## Teammates using Antigravity or other agents

Clone/open the repository root and follow [the teammate startup guide](docs/team-tasks/AGENT_START.md). It includes copy-paste prompts for all four teammates, role/account checks, /claim instructions and free-agent handoff steps. Root GEMINI.md, CLAUDE.md and opencode.json are entry points to the same canonical AGENTS.md. Accept any pending invitation and verify the bot claim before editing.

## Local development

Prerequisites: Node.js 24+ and npm 11+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validate with `npm run check`; workflow tests use `node --test tests/task-claim.test.cjs`. See [delivery gates](docs/ROADMAP.md) and [contribution rules](CONTRIBUTING.md).

## License

Source is MIT. Datasets, trained models and third-party content retain their own licenses; record licenses, attribution and review status before redistribution. Do not commit raw farmer photos, precise locations, secrets, datasets or weights.
