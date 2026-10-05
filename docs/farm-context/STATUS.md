# Setup status

Completed: three-member roster, briefs, exclusive teammate paths, shared v1 context contract, provider candidates, issue registry, /claim and /unclaim automation, PR scope check and claim unit tests.

Pending: human merge of setup PR; enable Team task scope as a required check; implement Tasks 6, 7 and 10; choose target crops/district/season and expert reviewer; verify provider availability/licensing; supply actual sensors if live telemetry is wanted.

Validation: `node --test tests/task-claim.test.cjs` — 9 passing tests covering authorized/idempotent claims, wrong identity/access, foreign assignment, missing mapping, closed/unregistered issues, release permission and ignored commands. `git diff --check` and `npm run check` (lint, typecheck, production build) pass after moving stale generated Next.js cache aside. Local workflow behavior is mocked; deployed /claim requires merge into main and a real issue-comment test.

No runtime weather, soil or recommendation behavior was implemented in this setup. No old task issue is closed or repurposed.
