# AgriRakshak: start here before teammate edits

Canonical instructions: [AGENTS.md](AGENTS.md). Contributor prompts: [AGENT_START.md](docs/team-tasks/AGENT_START.md). Owner reassignment: 2026-10-08.

## Activation and accounts

Setup #12, farm core #13 and training workflow #8 are merged. The new five-person registry/briefs must be merged into main before Tasks 11/12 can claim or the expanded Task 7 scope can pass. Fetch main and inspect tasks.json rather than relying on old preview branches.

Aanya and Anushka had pending repository invitations at the 2026-10-08 check. Accept using the mapped account before /claim. Existing Yashi/Arindam claims are confirmed; Kanika's claim is pending. Task reservation does not replace bot confirmation.

| Contributor | GitHub login | Task issue | Branch | Allowed paths |
| --- | --- | --- | --- | --- |
| Yashi | yashitripathi2007 | [#10](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/10) | codex/farm-task-7-yashi | docs/research/**; data/catalog/** |
| Kanika | KanikaSharma0721 | [#9](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/9) | codex/farm-task-6-kanika | ml/farm_context_audit/**; docs/exhibition/farm-context/** |
| Anushka | AnushkaSChandel | [#15](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/15) | codex/farm-task-11-anushka | ml/dataset_audit/**; docs/model-validation/** |
| Aanya | aanya25bce11372-stack | [#16](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/16) | codex/farm-task-12-aanya | docs/exhibition/device-qa/**; docs/exhibition/presentation/** |
| Arindam | kaalakhatta | [#11](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/11) | codex/farm-task-10-arindam | Owner-directed repository-wide integration |

## Start safely

1. Clone/open the GitHub repository root using your own account; preserve unrelated work and fetch main.
2. Paste your named prompt from AGENT_START.md. Agent reads the full brief, all owned files/scoped instructions, STATUS.md, issue checklist and open PRs.
3. Post exactly /claim on your issue and wait for bot confirmation; verify the assignee. If already confirmed, verify it is current and no other agent is active before resuming.
4. Report contributor/task, both allowed directories, exact branch, claim and next unfinished deliverable before editing.
5. Resume the registered branch if present, or create from origin/main only if absent. No competing historical branches, shared writable checkouts, shared credentials or concurrent same-task agents.
6. Deliver small M0–M5/package PRs, scoped validation and STATUS.md. Refs #issue for partial delivery; Closes only for full completion. Request kaalakhatta review; never push main or bypass checks.

Yashi owns nine research/catalog/education work packages and should first preserve/reconcile PR #14 on her registered Task 7 branch. Anushka's dataset/model audit, Kanika's farm-data cases and Aanya's device/rehearsal evidence have separate directories.

## Verification status

GitHub main ruleset Protect main was observed disabled on 2026-10-08; classic branch protection was absent. Existing web/scope workflows are not proof of enforced protection. No protection settings were changed by the reassignment. Real new-teammate claims/device passes remain pending until observed.

No paid GitHub connector is needed. Root CLAUDE.md, GEMINI.md and opencode.json point to AGENTS.md. A tool without Git/terminal access can review but must report limitations instead of claiming the edit/check/PR workflow ran.
