# Task 6: Data validation and exhibition QA

Contributor: Kanika
Branch: `codex/farm-task-6-kanika` (one active agent/checkout only)
Allowed path: `ml/farm_context_audit/**`

GitHub issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/9

## Start and claim

Read root AGENTS.md, docs/farm-context/PLAN.md, docs/farm-context/CONTRACT.md and every existing file in your allowed directory. Find your issue in docs/farm-context/tasks.json. Post `/claim` and wait for the bot to confirm assignment. Do not begin edits on a pending, failed or rejected claim. Your GitHub account is mapped in the registry; if it differs, contact Arindam. Create the exact branch above from latest origin/main, or resume that branch for the same active issue; never reset existing work.

Additional allowed path: `docs/exhibition/farm-context/**`. Keep a STATUS.md in each owned directory.

## Work

Build a dependency-free Python validator for normalized farm-context JSON, using the contract in docs/farm-context/CONTRACT.md. Do not build provider adapters or modify the contract.

Deliver audit.py, README.md, tests/, and synthetic JSON fixtures. Check required provenance, UTC timestamps, units, finite values, latitude/longitude bounds, missing values, status consistency, source kind, stale readings using a caller-supplied UTC clock and maximum age, and soil depth. Never turn missing values into zero. Produce a JSON report with errors and warnings; return nonzero for invalid input. The tool must not change input files. Mark invented fixture readings as synthetic.

Validation: `python3 -m unittest discover -s ml/farm_context_audit/tests -v`; document a passing and failing CLI example. No dependencies or agricultural thresholds are needed.

## Additional work in the second allowed directory

Deliver TEST_PLAN.md, DEMO_SCRIPT.md, JUDGE_QUESTIONS.md, RISK_REGISTER.md, and BUG_REPORT_TEMPLATE.md for the new context and recommendations journey.

Cover permission denied, revoked permission, manual district/coordinates, inaccurate GPS, camera without location, missing soil/sensor inputs, stale data, units/depth, provider timeout/rate limits, offline/cached/demo data labels, unsupported region/crop, unreviewed content, conflicting evidence, seed suggestions with missing season/water inputs, and privacy (no precise location/photo retention by default). Include accessibility and mobile layout. Test unsupported-condition and low-confidence scans separately from farm-context advice.

Use not-run/pass/fail/blocked with observed evidence; no fabricated test passes. Explain why weather/soil estimates are not live field sensors and why advice is educational. Five-minute demo with a clearly labeled synthetic fallback. No implementation or model accuracy claims until verified.

Validation: trace every test to docs/farm-context/CONTRACT.md and acceptance criteria; list TBD values and unimplemented features.


## Cumulative work and handoff

Inspect the issue checklist, linked PRs and current allowed directory to continue unfinished items. Previous task briefs 1–4 are preserved as historical backlog; this issue is the active assignment. Do not silently combine the old tasks with this one. Keep STATUS.md within your allowed directory (Arindam: docs/farm-context/CORE_STATUS.md) with completed items, remaining work, validation evidence and blockers. Close completion gaps before proposing new scope.

## Submission

Show the diff, commit and push only the task branch, open a PR to main with `Closes #<issue>`, request kaalakhatta review, include Task 6, changed paths, commands/output, sources, limitations and confirmation of allowed scope. Never merge. If handing over unfinished work, document the branch/PR in the issue before `/unclaim`. A claim reserves one contributor task; it does not create a branch or permit two agents for one account to edit simultaneously.
