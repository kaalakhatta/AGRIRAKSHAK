# Task 12: Device QA and exhibition readiness

Contributor: Aanya (@n0debug) — owner-requested account change, 2026-10-08
Branch: `codex/farm-task-12-aanya`
Issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/16
Allowed paths: `docs/exhibition/device-qa/**` and `docs/exhibition/presentation/**`.
Owner reassignment: 2026-10-08. Historical Task 4 is a reference; use this active task and registered branch.

## Start and claim

n0debug has verified collaborator write access. The previous account aanya25bce11372-stack is no longer mapped to Task 12; its pending invitation is not required. The n0debug /claim attempt was rejected before this registry change; repeat /claim after the updated mapping is on main and wait for bot confirmation. Owner issue assignment alone is not a confirmed claim. Read root AGENTS.md, AGENT_START.md, docs/farm-context/PLAN.md, CONTRACT.md and all four docs/farm-companion planning documents. Inspect issue, branch/PRs, scoped instructions and every owned file. Post /claim with your mapped account; wait for confirmation and verify assignee before editing. Create the exact branch from current origin/main only if absent, otherwise resume inspected existing work. One active agent/checkout.

## D1 — Device/browser and accessibility test package

Under docs/exhibition/device-qa create TEST_PLAN.md, DEVICE_MATRIX.md, EXECUTION_LOG.md, BUG_REPORTS.md and STATUS.md. Identify build/commit/schema, device/browser versions, viewport, network and synthetic fixture IDs for every run. Test Today/Plan/Scan/Records/My Farm, responsive layout, keyboard/focus, labels/errors, zoom and available screen-reader behavior. Use not-run/pass/fail/blocked with observed evidence; unavailable devices remain TBD. Kanika owns contract/calculation regression fixtures; reference her cases rather than duplicating her validator.

## D2 — Privacy, backup and failure journeys

Test location denied/manual/skip/revoke, camera separately from location, missing/stale weather, provider/network failure isolation, unavailable model, unsupported/uncertain results only when actual fixtures/runtime support exists, invalid/large/empty files, reload persistence, backup download/import/conflicts, deletion confirmation and storage failure. Test offline/update behavior only on a build that actually implements it. A session cache is not an installed offline app. Old/new backup schemas and rollback need explicit compatible-build evidence; never risk real farmer data to test failure.

Use labelled synthetic records only. Keep screenshots outside Git if they could contain personal data; anonymize approved evidence. Permission actions require the user's consent. Do not upload photos to a live inference endpoint or mutate real local records merely to execute a checklist. Read-only/manual testing and synthetic records must stay distinct.

## D3 — Exhibition explanation and rehearsal package

Under docs/exhibition/presentation create DEMO_SCRIPT.md, JUDGE_QUESTIONS.md, RISK_REGISTER.md, FALLBACK_PLAN.md, RELEASE_CHECKLIST.md and STATUS.md. Build a five-minute Plan → Monitor → Improve script with optional material, visibly labelled synthetic fallback and honest unavailable-model/content cases. Pull scientific claims and source links from Yashi's verified register; pull model limitations from Anushka and contract QA from Kanika. Never invent accuracy, expert approval, timings, soil sensors, diagnosis, treatment or yield gains.

Risk entries include likelihood/impact, detection, mitigation, responsible contributor and fallback. Trace release gates to F01–F13/M0–M5, tested builds/devices, export/restore, licenses and rollback. Record three actual rehearsals with build/device/date/outcome and unresolved defects; until run, leave not-run. Owner decides release readiness; this task does not deploy or approve release.

## Milestones and checks

- M0–M1: D1 matrix and persistence/privacy/backup test cases.
- M2–M4: D2 execution of available journeys, accessibility and bug reproductions.
- M5: D3 evidence-linked presentation, fallback/rollback checklist and three rehearsals.

Report defects with precise reproducible steps, expected/actual behavior, build, evidence and severity; route fixes to Arindam rather than modifying apps/web. Maintain status in both directories. Check Markdown links, case-to-requirement traceability, all TBD/not-run entries and git diff --check. No root dependencies, workflows, code, catalog, dataset/model, secrets or personal images/locations.

Submit Task 12 milestone PRs with Refs #16, scope, observed checks and gaps, and kaalakhatta review. Closes only for full completion. Never merge/push main, fabricate device results or use a second concurrent agent on the task.
