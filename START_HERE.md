# AgriRakshak: start here before any teammate edits

Canonical instructions: [AGENTS.md](AGENTS.md). Full cross-agent prompts: [AGENT_START.md](docs/team-tasks/AGENT_START.md).

## Activation

Setup PR: https://github.com/kaalakhatta/AGRIRAKSHAK/pull/12 . The human repository owner must review/merge it. Until then the repository's default main branch still has the old roster. Do not start work from those old assignments. No agent may merge or push main.

Preview the new setup here: https://github.com/kaalakhatta/AGRIRAKSHAK/tree/codex/farm-context-team-setup . Use that link only to read the updated instructions before merge. Implementation branches start from the updated main after merge and a verified claim, not from the setup preview branch.

## Tell your agent who you are

| Contributor | GitHub login | Task issue | Branch | Allowed paths |
| --- | --- | --- | --- | --- |
| Kanika | KanikaSharma0721 | [#9](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/9) | codex/farm-task-6-kanika | ml/farm_context_audit/**; docs/exhibition/farm-context/** |
| Yashi | yashitripathi2007 | [#10](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/10) | codex/farm-task-7-yashi | docs/research/farm-context/**; data/catalog/farm-context/** |
| Arindam | kaalakhatta | [#11](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/11) | codex/farm-task-10-arindam | Owner-directed integration |

After the owner merges setup:

1. Clone/open the repository root with your own GitHub account. If already cloned, save unrelated work and fetch the updated main; do not reset files blindly.
2. Paste your exact Kanika/Yashi startup prompt from AGENT_START.md. Any agent can read it explicitly; automatic instruction support depends on the tool/version.
3. Comment exactly /claim on your issue with the mapped account. Wait for the bot's confirmation and check the assignee. A posted command is not a confirmed claim.
4. Agent reports your task, both allowed directories, claim state, exact branch and next unfinished deliverable before editing.
5. Resume existing branch/PR or create the registered branch from updated main if absent; no competing branches or simultaneous same-account agents.
6. Deliver scoped milestones with evidence and STATUS.md. PR to main references the task; only full task completion closes it. Human owner reviews/merges.

## GitHub readiness verified 2026-10-05

Actions is enabled. Main's active protection requires web and scope check contexts; existing review/update/force-push rules and bypass settings were preserved. Instruction entry points and task issues are uploaded in PR #12. The claim workflow does not activate until the human merge. Teammate sessions/claims are not yet proven; smoke-test them after merge.

No paid GitHub connector or shared owner credentials are needed. Root GEMINI.md, CLAUDE.md, AGENTS.md and opencode.json guide supported tools; a generic agent uses the explicit prompt. Browsing/terminal/Git limitations must be reported rather than fabricated around.
