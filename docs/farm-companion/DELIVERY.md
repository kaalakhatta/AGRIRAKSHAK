# Repository layout, ownership and delivery protocol

This is the target layout; directories marked planned must not be presented as implemented. Avoid introducing packages/services until a milestone needs them.

## Repository map

```text
apps/web/                         Existing Next.js app; Arindam owns all runtime work
  app/                            Planned routes: today, plan, scan, records, farm, knowledge
  features/                       Planned domain UI: farm, weather, recommendations,
                                  calendar, scanning, soil, expenses, harvest
  lib/
    domain/                       Planned entities, validation, units, local dates
    storage/                      Planned IndexedDB repositories, migrations, export/import
    providers/                    Planned weather adapter; optional telemetry adapter
    recommendations/              Planned pure rule evaluator + catalog validation
    inference/                    Existing scanner types; preserve evaluated model contract
  tests/                          Planned domain/provider/storage/integration tests
  public/                         App assets; approved model release mechanism, not Git weights

data/catalog/                     Arindam: disease/quiz and farm catalog schemas, draft content
  farm-context/                   Seed/action/crop/calendar/evidence catalog work
  seed.schema.json                Planned
  action.schema.json              Planned
  crop.schema.json                Planned
  calendar.schema.json            Planned
  evidence.schema.json            Planned
  CONTENT_GUIDE.md, examples/      Planned; reviewed entries introduced only with real review

docs/research/                    Yashi: literature, sources/provider/claims/reviewer/license gaps
ml/farm_context_audit/            Kanika: dependency-free input/output audit and fixture tests
docs/exhibition/farm-context/     Kanika: contract/regression traceability and fixture expectations
ml/dataset_audit/                 Anushka: dataset integrity and split/leakage audits
docs/model-validation/            Anushka: model evidence/readiness protocol and gaps
docs/exhibition/device-qa/        Aanya: observed device/accessibility/privacy/offline QA
docs/exhibition/presentation/     Aanya: demo/judge/fallback/rehearsal/release evidence
ml/src/agrirakshak_ml/            Yashi: existing training/evaluation/export pipeline
ml/tests/, ml/notebooks/          Yashi: pipeline tests and free Colab notebook
ml/pyproject.toml, COLAB.md,       Yashi: exact-file scopes (paths include ml/ prefix)
  README.md, MODEL_CARD_TEMPLATE.md
services/                        Existing untracked model artifacts: preserve, inspect only
                                  before any integration; do not add model weights to Git
scripts/                         Planned owner-only catalog/release validation helpers
.github/                         Existing CI, claim/scope workflows; Arindam only

docs/farm-companion/              Shared owner-maintained build/data/engine/delivery plan
docs/farm-context/               Existing context v1, issue registry and phase entry point
docs/team-tasks/                 Active briefs 6/7/10/11/12; historical 1–4 retained
```

Within apps/web, domain rules/storage must be independent of React components. UI consumes typed services. No new training model for recommendations. Optional backend/sensor service is a later addition, not needed for core free build.

## Contracts and handoffs

| Producer → consumer | Artifact | Gate |
| --- | --- | --- |
| Arindam → Kanika | Existing context v1 and new versioned domain contracts | Shared schemas stable before audit implementation |
| Yashi → Arindam | Evaluated ONNX bundle contract, real metrics/model card, dataset/license/source register | Reproducible training/export, supported labels, honest target-crop/field gaps |
| Arindam → runtime | Reviewed seed/action/calendar catalogs for selected coverage | Verified evidence, genuine agronomic review and input checks |
| Kanika → Arindam | Independent synthetic fixtures, expected outcomes, QA traceability | Fixtures label synthetic and do not invent agricultural thresholds |
| Arindam/Kanika → Aanya | Implemented build, expected cases and known gaps | Real device/rehearsal execution; pending is not pass |
| Arindam → Anushka | Supplied manifests/model/evaluation evidence | Independent audit; absent artifacts remain unavailable |
| Yashi/Anushka → Aanya | Verified claims and model limitations | Presentation reflects actual evidence |
| All teammates → owner | Milestone PR, STATUS.md evidence and next steps | Human review/merge; no agent merges without explicit owner authorization |

Task 6 owns only ml/farm_context_audit/** and docs/exhibition/farm-context/**. Task 7 owns docs/research/**, ml/src/agrirakshak_ml/**, ml/tests/**, ml/notebooks/** and the exact files ml/pyproject.toml, ml/COLAB.md, ml/README.md, ml/MODEL_CARD_TEMPLATE.md. Arindam owns data/catalog and all runtime intelligence. Task 11 owns only ml/dataset_audit/** and docs/model-validation/**. Task 12 owns only docs/exhibition/device-qa/** and docs/exhibition/presentation/**. Arindam owns remaining paths and integration, but must not concurrently edit teammate-owned files. Coordinate schema changes through their issues and review; shared-contract changes require an explicit version and migration note.

## Claim and cumulative branch workflow

1. Read root/scoped AGENTS.md, full brief and this build plan. Inspect STATUS.md, issue checklists, all owned files and open PRs.
2. Post exactly /claim on your registered issue. Wait for confirmation; claims are active only after setup merge. Same GitHub account can still start two agents: prohibit that operationally.
3. Separate clone/worktree for each contributor. Fetch main. Use registered branch, never a shared working checkout. If it exists, inspect/resume; never reset remote work.
4. Deliver one milestone slice, run brief/domain checks, update STATUS.md and show diff. PR includes Task N, milestone M, validation/evidence and allowed-path confirmation.
5. Intermediate PRs use Refs #issue. Final complete cumulative delivery uses Closes #issue. Do not close the issue merely because one milestone is merged.
6. After human merge, fetch and reconcile with main without force-pushing over others. If a branch was deleted, recreate the same registered branch from main after confirming the milestone PR is merged. Never resurrect old commits by blindly pushing a stale branch.
7. Record remaining work before /unclaim. Reclaimer resumes the documented branch/PR/checklist. Cross-task overlap goes to Arindam.

The existing PR scope check validates registered branches/authors/claim and both old/new rename paths. Setup #12 is merged and the workflows exist on main. The live main ruleset was observed disabled on 2026-10-08; web/scope runs do not prove enforced protection. Roster #17 is merged; the revised training scopes must land before Yashi’s ML edits pass CI. Existing historical issues/PRs stay preserved; use active task issues, not duplicate legacy assignments.

## Verification per milestone

- Always: relevant brief checks, `git diff --check`, no unrelated paths/artifacts, source/reviewer verification for advice.
- Runtime changes: `npm run check` and focused domain tests. Use `node --test` where sufficient or a reviewed free runner; do not add a paid testing service.
- Storage: fake IndexedDB/local environment as appropriate plus actual browser import/export/migration/delete cases.
- Weather: fake HTTP and clocks; timeout/offline/error/units/freshness cases; optional manual provider smoke test, never a CI dependency.
- Recommendations: positive reviewed fixture and negative missing/draft/unsupported/stale/conflict cases; no mirror-only tests.
- QA: desktop/mobile accessibility, permission flows, storage failure, offline/no model, all critical journey steps. Record not-run/blocked distinctly.
- Release: dependency/license inventory, executable/catalog version manifest, verified model metrics if used, downloadable local build and rehearsal evidence.

## Free-service budget and failure behavior

Open-Meteo free access is non-commercial with published limits (600/minute, 5,000/hour, 10,000/day, 300,000/month as checked 2026-10-05); attribution is required. Request one 7-day payload with at most ten weather variables to keep request weight small. Start with temperature, humidity, precipitation, wind, plus daily rainfall/min/max temperature; normalize units explicitly.

Initial engineering defaults: a 30-minute weather fetch cache, refresh on user action with a local one-minute throttle, timeout 8 seconds, at most one delayed retry for transient failures, and never retry a 429 immediately. Respect Retry-After if present. These are network policies, not agronomic thresholds. Keep source timestamps: cached/expired values show age and do not satisfy freshness-sensitive rules. A per-device cache does not enforce aggregate provider quotas; before public scale, recheck suitability and keep a local/manual fallback rather than purchasing capacity.

Weather API calls are direct client requests where supported; verify CORS and browser behavior at M2. If blocked, use a confirmed zero-cost same-origin proxy only if needed, or disable live enrichment. Keys are unnecessary; no secrets in app bundles. Changing provider requires permission/attribution and contract review. Avoid geocoding/tile dependencies by supporting manual region and coordinate entry first; a map is optional.

SoilGrids REST is paused and unsuitable as a dependency for field advice. No automated field soil-map fetch in first release. Manual soil entries are the first path. Optional regional map exploration is later, with license/scale/availability checks.

Local-first app needs no hosted DB, auth, queue, paid map, LLM or messaging API. Use existing free hosting only after checking its current terms; maintain a static export/GitHub Pages route if framework features permit, and a runnable local build. GitHub Pages serves static files, not inference/API services. Hosted scanner inference is optional and must have a local/offline demonstration fallback; model feasibility remains a release gate. Free hosting/API limits can change; if no eligible free host remains, distribute/run locally rather than incur cost.

Primary references checked 2026-10-05:
- https://open-meteo.com/en/pricing
- https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html
- https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_04.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Release and post-release

M5 release manifest lists app/schema/engine/catalog/model versions, supported crops/regions/languages, provider terms checked date, known failures and tested devices. Cache application assets and reviewed catalog with a versioned update prompt; do not cache real images. Static export feasibility and service-worker behavior must be tested before promising Pages/offline. Rollback uses a previous app/catalog release; preserve compatible farmer data and export before migrations.

Later exploration: multiple fields, reviewed translations, sensor feeds using existing hardware, structured soil-report import, offline model optimization and optional notifications. Cloud sync, yield prediction, automatic report OCR, marketplace, market prices and paid communication are excluded until separately scoped with zero-cost verified data/compute paths. No paid upgrade is part of this plan.
