# Task 6: Farm-data validation and regression QA

Contributor: Kanika
Branch: `codex/farm-task-6-kanika` (one active agent/checkout only)
Allowed path: `ml/farm_context_audit/**`

GitHub issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/9

## Start and claim

Read root AGENTS.md, docs/farm-context/PLAN.md, docs/farm-context/CONTRACT.md and every existing file in your allowed directory. Find your issue in docs/farm-context/tasks.json. Post `/claim` and wait for the bot to confirm assignment. Do not begin edits on a pending, failed or rejected claim. Your GitHub account is mapped in the registry; if it differs, contact Arindam. Create the exact branch above from latest origin/main, or resume that branch for the same active issue; never reset existing work.

Additional allowed path: `docs/exhibition/farm-context/**`. Keep a STATUS.md in each owned directory.

## Full companion scope

Read docs/farm-companion/BUILD_PLAN.md, DATA_MODEL.md, RECOMMENDATION_ENGINE.md and DELIVERY.md. Work incrementally through M0–M5; keep these milestone IDs and remaining checklists in STATUS.md. No paid API, subscription, card-required service or paid AI tooling. Preserve the existing context v1; farm records need separate versioned contracts.

## Work

Build a dependency-free Python validator for normalized farm-context JSON, using the contract in docs/farm-context/CONTRACT.md. Do not build provider adapters or modify the contract.

Deliver audit.py, README.md, tests/, and synthetic JSON fixtures. Check required provenance, UTC timestamps, units, finite values, latitude/longitude bounds, missing values, status consistency, source kind, stale readings using a caller-supplied UTC clock and maximum age, and soil depth. Never turn missing values into zero. Produce a JSON report with errors and warnings; return nonzero for invalid input. The tool must not change input files. Mark invented fixture readings as synthetic.

Validation: `python3 -m unittest discover -s ml/farm_context_audit/tests -v`; document a passing and failing CLI example. No dependencies or agricultural thresholds are needed.

## Additional work in the second allowed directory

Deliver TEST_PLAN.md, TRACEABILITY.md, REGRESSION_CASES.md, RISK_REGISTER.md and BUG_REPORT_TEMPLATE.md for farm-context/domain validation. Preserve any existing presentation material, but Aanya now owns new device execution, demo scripts, judge questions and rehearsals in her separate paths. Hand off case IDs and expected outcomes without editing her directories.

Cover permission denied, revoked permission, manual district/coordinates, inaccurate GPS, camera without location, missing soil/sensor inputs, stale data, units/depth, provider timeout/rate limits, offline/cached/demo data labels, unsupported region/crop, unreviewed content, conflicting evidence, seed suggestions with missing season/water inputs, and privacy (no precise location/photo retention by default). Include accessibility and mobile layout. Test unsupported-condition and low-confidence scans separately from farm-context advice.

Use not-run/pass/fail/blocked with observed evidence; no fabricated test passes. Explain why weather/soil estimates are not live field sensors and why advice is educational. Provide labelled synthetic fixture expectations for Aanya's demo/fallback package. No implementation or model accuracy claims until verified.

Validation: trace every test to docs/farm-context/CONTRACT.md and acceptance criteria; list TBD values and unimplemented features.


## Companion milestones: lightweight independent verification

- M0–M1: audit context v1 and build traceability cases for local field/cycle persistence, permission denial, coordinate-free export, corrupt/duplicate import, deletion and storage failures. Arindam implements runtime validators; you own independent fixtures/checklists.
- M2–M3: freshness/source/unit fixtures, rule abstention/conflicts, calendar stage/date changes, seed applicability, uncertainty and scanner timeline cases. Do not invent agricultural thresholds.
- M4: expense/harvest unit and amount calculations, missing area, incomplete records, sales versus harvest, refunds, edits/deletes, backup round-trip and migration rollback cases.
- M5: rerun the independent validator/regression cases, triage contract/unit/privacy defects and provide TRACEABILITY.md mapping F01–F13/milestones to case IDs and evidence. Aanya owns real device/accessibility/offline execution and three rehearsals; consume her evidence without counting not-run cases as passes.

Your coding scope remains the small audit utility and fixtures; do not build app screens, storage, API adapters or recommendation logic. As new domain contracts arrive, report gaps rather than silently extending context v1. Never claim automatic yield improvement or full profit from incomplete records.

## Cumulative work and handoff

Inspect the issue checklist, linked PRs and current allowed directory to continue unfinished items. Previous task briefs 1–4 are preserved as historical backlog; this issue is the active assignment. Do not silently combine the old tasks with this one. Keep STATUS.md within your allowed directory (Arindam: docs/farm-context/CORE_STATUS.md) with completed items, remaining work, validation evidence and blockers. Close completion gaps before proposing new scope.

## Submission

Show the diff, commit and push only the task branch, open a PR to main with milestone ID and `Refs #<issue>` for partial delivery; use `Closes #<issue>` only once the full cumulative assignment is complete, request kaalakhatta review, include Task 6, changed paths, commands/output, sources, limitations and confirmation of allowed scope. Never merge. If handing over unfinished work, document the branch/PR in the issue before `/unclaim`. A claim reserves one contributor task; it does not create a branch or permit two agents for one account to edit simultaneously.
