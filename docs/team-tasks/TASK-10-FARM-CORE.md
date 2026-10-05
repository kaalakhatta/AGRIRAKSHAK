# Task 10: Farm companion core and integration

Contributor: Arindam
Branch: `codex/farm-task-10-arindam` (one active agent/checkout only)
Allowed path: `owner-directed` — repository-wide integration; coordinate any overlap through issues

GitHub issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/11

## Start and claim

Read root AGENTS.md, docs/farm-context/PLAN.md, docs/farm-context/CONTRACT.md and every existing file in your allowed directory. Find your issue in docs/farm-context/tasks.json. Post `/claim` and wait for the bot to confirm assignment. Do not begin edits on a pending, failed or rejected claim. Your GitHub account is mapped in the registry; contact Arindam if it differs. Create the exact branch above from latest origin/main, or resume that branch for the same active issue; never reset existing work.

## Full companion scope

Read docs/farm-companion/BUILD_PLAN.md, DATA_MODEL.md, RECOMMENDATION_ENGINE.md and DELIVERY.md. Work incrementally through M0–M5; keep these milestone IDs and remaining checklists in STATUS.md. No paid API, subscription, card-required service or paid AI tooling. Preserve the existing context v1; farm records need separate versioned contracts.

## Work

Own the heavy implementation: versioned TypeScript contracts, weather adapters with direct browser access where supported; zero-cost proxy only if necessary, sensor ingress if hardware is supplied, provider timeouts/cache/provenance, location consent and manual fallback, deterministic recommendation engine, scanner result UI, integration tests, privacy controls, CI and deployment.

Implement local farm/cycle storage first, weather second, recommendations only from reviewed evidence and complete required inputs. Manual measured soil entries come before optional regional maps. Select providers after Task 7; weather and soil failures must be independent and must not prevent disease scanning. No API keys in the client. Normalize units and soil depths before evaluating rules. Sanitize telemetry, authenticate device submissions, and enforce timestamps before any live sensor label. Without a device, display unavailable or explicitly synthetic demo readings.

Use crop, region, season, soil evidence and water availability for seed candidate screening; never infer NPK, soil pH or cultivar suitability from a leaf image/GPS. Return candidates, reasons, evidence, missing inputs and cautions, not yield guarantees. Do not rank varieties until a reviewed scoring protocol exists. Build action guidance separately from disease prediction confidence. Block draft content and stale required inputs, and abstain on unsupported crops/regions.

Acceptance: scan works with location denied; manual location works; context cards show source/time/kind/status; provider failure is isolated; no precise location in logs/storage by default; invalid units and stale required inputs abstain; draft recommendations never render; synthetic data has visible labels; reviewed fixture produces an explainable candidate; mobile flow passes QA.

Validation: `npm run check`, meaningful engine/adapter tests with fake clocks and HTTP fixtures, and Task 6 device checklist. Integrate Tasks 6–7 after review. No merge by an agent.

## Core milestones and acceptance

- M0: resolve roadmap/architecture consistency, protect claims/scope, confirm initial coverage/reviewer/device with owner; no arbitrary agronomic defaults.
- M1: implement domain types/validation, IndexedDB repositories/migrations, profile/cycle UI, transient-by-default coordinates with local-save opt-in, validated export/import/delete. No mandatory cloud DB/accounts.
- M2: weather adapter/cache/budget/failure handling, Today UI, allowlisted declarative engine, review/evidence gate and deterministic tests. Distinguish missing data from inapplicable rules.
- M3: reviewed seed comparisons, stage/date calendar, conflict resolution, action feedback and independent scanner timeline. Preserve scanner model preprocessing/uncertainty and actual availability.
- M4: manually entered soil readings, observations, expenses, harvest/sales, edit/delete and season summaries. Test INR minor-unit sums, area/quantity normalization, missing denominators and incomplete-cost warnings; no inferred profit or causal yield uplift.
- M5: focused tests, real device QA, offline/update behavior, eligible free/static hosting or local bundle, license/version manifest, rollback and backup. Browser inference needs actual model/device feasibility; no paid inference dependency.

Owner scope allows selecting necessary free open-source dependencies after checking existing capabilities, license and size. Do not install paid services or modify user model artifacts. Maintain CORE_STATUS.md with milestone progress and integration blockers; coordinate changes in teammate-owned directories before editing.

## Cumulative work and handoff

Inspect the issue checklist, linked PRs and current allowed directory to continue unfinished items. Previous task briefs 1–4 are preserved as historical backlog; this issue is the active assignment. Do not silently combine the old tasks with this one. Keep STATUS.md within your allowed directory (Arindam: docs/farm-context/CORE_STATUS.md) with completed items, remaining work, validation evidence and blockers. Close completion gaps before proposing new scope.

## Submission

Show the diff, commit and push only the task branch, open a PR to main with milestone ID and `Refs #<issue>` for partial delivery; use `Closes #<issue>` only once the full cumulative assignment is complete, request kaalakhatta review, include Task 10, changed paths, commands/output, sources, limitations and confirmation of allowed scope. Never merge. If handing over unfinished work, document the branch/PR in the issue before `/unclaim`. A claim reserves one contributor task; it does not create a branch or permit two agents for one account to edit simultaneously.
