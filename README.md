# AgriRakshak

**Teammate agents: read [START_HERE.md](START_HERE.md) before edits. The updated setup activates on main after human merge of [PR #12](https://github.com/kaalakhatta/AGRIRAKSHAK/pull/12).**

AgriRakshak is a college exhibition farm companion planned to help farmers plan crops, monitor a growing season and review their records. Preliminary leaf-disease screening is one part of the product.

[Open the existing web prototype](https://agrirakshak-gamma.vercel.app). The full companion described here is planned work, not a claim that all features are deployed.

## Product direction

- My Farm: confirmed field location, crop cycle and water access
- Today: free weather context, due tasks and explainable reviewed guidance
- Plan: regional seed/crop candidates and stage-based crop calendar
- Scan: preliminary disease screening, uncertainty and optional crop timeline
- Records: measured soil entries, observations, expenses, harvests and season summaries

No guaranteed yield increases, professional diagnoses or pesticide/fertilizer prescriptions. Recommendations require applicable reviewed evidence; missing data stays missing. GPS does not measure soil nutrients. Weather estimates are not actual field sensors.

## Zero-paid-service build

Keep Next.js/TypeScript and the existing scanner work. Use local browser storage for farm records, versioned reviewed content, and a deterministic rule engine. No mandatory accounts, hosted database, paid AI, subscription APIs or card-required services. Optional weather enrichment uses eligible free access with cache/failure labels; a local runnable build is always required. Sensor hardware and external inference are not assumed available. Model unavailability never produces a fabricated result.

## Current core milestone

The new `/farm` screen implements local field/crop-cycle records, confirmed optional location, and backup/import/delete controls. Open `/farm` to manage records and `/today` for a selected field’s overview. M2 adds opt-in Open-Meteo weather, session caching/failure handling, information prompts and a tested declarative recommendation evaluator. M3 adds `/plan` personal season reminders, completion tracking and confirmed sowing-date rescheduling. The scanner can explicitly save a labelled demonstration summary to `/records` without retaining a photo, location or simulated confidence. Records now also includes a local soil notebook: manually enter pH, organic carbon, sand and clay with sample date, source, optional depth and method. Edit/delete tests and view field-specific soil preparation prompts on Today. Old farm backups remain importable; schema-4 backups include reminders, summaries and soil tests. See [soil notebook validation](docs/farm-companion/M4_SOIL.md). See [timeline validation](docs/farm-companion/M3_TIMELINE.md). Runtime agricultural advice remains unavailable until reviewed catalogs arrive. See [M3 calendar validation](docs/farm-companion/M3_CALENDAR.md). See [M2 contracts and validation](docs/farm-companion/M2_CONTRACT.md). See [M1 validation](docs/farm-companion/M1_VALIDATION.md) and [core status](docs/farm-context/CORE_STATUS.md) for observed checks and pending device QA.

## Build plan and team

Read [full build plan](docs/farm-companion/BUILD_PLAN.md), [architecture](docs/ARCHITECTURE.md), [data model](docs/farm-companion/DATA_MODEL.md), [engine plan](docs/farm-companion/RECOMMENDATION_ENGINE.md) and [repository/delivery protocol](docs/farm-companion/DELIVERY.md).

Arindam owns the heavy implementation (Task 10/#11), Kanika owns independent data validation/QA (Task 6/#9), and Yashi owns evidence/content (Task 7/#10). Agents read [AGENTS.md](AGENTS.md), their complete brief and [task registry](docs/farm-context/tasks.json), then use the [/claim workflow](CONTRIBUTING.md). The bot activates after the setup PR is human-merged. Historical assignments are preserved.

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

Clone/open the repository root and follow [the teammate startup guide](docs/team-tasks/AGENT_START.md). It includes copy-paste prompts for Kanika and Yashi, role/account checks, /claim instructions and free-agent handoff steps. Root GEMINI.md, CLAUDE.md and opencode.json are entry points to the same canonical AGENTS.md. Setup must be human-merged before claims work on main.

## Local development

Prerequisites: Node.js 24+ and npm 11+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validate with `npm run check`; workflow tests use `node --test tests/task-claim.test.cjs`. See [delivery gates](docs/ROADMAP.md) and [contribution rules](CONTRIBUTING.md).

## License

Source is MIT. Datasets, trained models and third-party content retain their own licenses; record licenses, attribution and review status before redistribution. Do not commit raw farmer photos, precise locations, secrets, datasets or weights.
