# Start here: teammate agents

Use the same protocol in Codex, Antigravity, Claude, OpenCode or another coding agent. Root AGENTS.md is authoritative; tool-specific files only point here. This guide does not install tools, select a paid model, or supply credentials. “OpenCore” may refer to another tool: use the explicit prompts below whenever automatic rule discovery is unknown.

## Before the teammates begin

Arindam must human-review and merge setup PR #12. The active task registry and claim workflow must exist on main. Do not start from the old main instructions or from an uploaded ZIP that lacks Git metadata. A preview of this PR is not authorization to work before a claim succeeds.

After merge, confirm Actions is enabled, verify the task scope check remains required protection, and smoke-test /claim with each actual teammate account. Required-check identifiers use the check-run context `scope` (workflow name: Team task scope); inspect the branch-protection UI/check run before selecting it. If claims fail, show the Actions failure and contact Arindam rather than assigning yourself silently. The setup does not automatically configure protection or teammate tool permissions.

## Open the repository

Use the tool's clone/import-from-GitHub function, or run:

```bash
git clone https://github.com/kaalakhatta/AGRIRAKSHAK.git
cd AGRIRAKSHAK
```

Open this repository root as the agent workspace. Each contributor uses their own clone and GitHub login; never share the owner's token or a writable checkout. No special GitHub MCP/plugin is necessary: normal Git plus GitHub website or the free `gh` CLI is sufficient. `gh` is optional. A tool without terminal/Git access can review files but cannot perform the full edit/validate/PR workflow; use a capable local environment or hand the patch/evidence to the contributor.

Automatic instruction discovery depends on tool/version. Antigravity recognizes AGENTS.md/GEMINI.md; OpenCode recognizes AGENTS.md with optional opencode.json instructions; CLAUDE.md tells Claude-family tools to read the canonical file. Other agents should be given the explicit prompt below. Do not run an initialization command that overwrites existing instructions.

## Copy-paste prompt: Kanika

```text
Hi, I'm Kanika. Read root AGENTS.md, docs/team-tasks/AGENT_START.md,
docs/team-tasks/TASK-6-CONTEXT-AUDIT.md, the full companion build plan
and context contract before changing anything. My GitHub account is
KanikaSharma0721. My cumulative task is issue #9; the exact branch is
codex/farm-task-6-kanika. I authorize you to post /claim on my issue
using my account; otherwise guide me to post it in GitHub. Wait for
bot confirmation and verify the issue assignee before editing.
Only edit ml/farm_context_audit/** and docs/exhibition/farm-context/**.
Inspect existing files, STATUS.md, issue checklist and linked PRs;
continue the earliest unfinished milestone. Report my task, allowed
paths, claim state, branch and next deliverable first. Run the brief's
checks, show the diff, commit/push my task branch and open a milestone
PR for kaalakhatta review. Never merge or push main. No paid services,
app integration code or fabricated test/source/approval results.
```

## Copy-paste prompt: Yashi

```text
Hi, I'm Yashi. Read root AGENTS.md, docs/team-tasks/AGENT_START.md,
docs/team-tasks/TASK-7-FARM-EVIDENCE.md, the full companion build plan
and context contract before changing anything. My GitHub account is
yashitripathi2007. My cumulative task is issue #10; the exact branch is
codex/farm-task-7-yashi. I authorize you to post /claim on my issue
using my account; otherwise guide me to post it in GitHub. Wait for
bot confirmation and verify the issue assignee before editing.
Only edit docs/research/farm-context/** and data/catalog/farm-context/**.
Inspect existing files, STATUS.md, issue checklist and linked PRs;
continue the earliest unfinished milestone. Report my task, allowed
paths, claim state, branch and next deliverable first. Verify primary
sources, validate schemas/examples, show the diff, commit/push my task
branch and open a milestone PR for kaalakhatta review. Never merge or
push main. No paid services, web/engine code, invented citations,
agricultural thresholds or reviewer approvals. If browsing is unavailable,
mark sources unverified and continue schema work within scope.
```

## Claim and branch checks

/claim is an exact GitHub issue comment, not a command in the agent chat or terminal. Links: [Kanika #9](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/9), [Yashi #10](https://github.com/kaalakhatta/AGRIRAKSHAK/issues/10). Claims require the mapped account and repository write access. A wrong/owner account cannot claim a teammate issue. Do not treat posting as success.

If gh is available, these read-only commands help verify identity/state:

```bash
git status --short
git remote -v
git branch --show-current
gh api user --jq .login
gh issue view 9 --repo kaalakhatta/AGRIRAKSHAK --json assignees,state,body
```

Yashi uses issue 10 in the last command. If gh is not available, check the signed-in GitHub account, issue assignee, bot confirmation and PR list in the browser. Local Git commit name/email is not GitHub authentication. Do not expose or paste tokens into chat/files.

After confirmation, fetch origin/main and inspect whether your exact branch already exists locally/remotely. Create it from main only if absent. Resume existing branch/PR otherwise; never blindly reset, force-push, or create a competing branch. One active agent per contributor; a confirmed claim does not lock out another session using the same account.

## Work and validation

- Read all existing files in both owned directories and nested instructions. Keep STATUS.md in each directory with current milestone, completed/pending items, test evidence and blockers.
- Kanika starts with the dependency-free Python audit and independent QA cases; Yashi starts with evidence inventory and schemas. Neither needs the app/server running to begin. Python/schema tooling must be free. No root dependency installs/changes by teammates.
- Yashi opens sources before marking verified. If offline, draft schemas and gap inventories can proceed; fabricated citations/review are forbidden.
- Run the brief's commands, inspect changed paths (including untracked files), and show the contributor the diff/limitations. A passing status check does not authorize merging.
- Open a small PR to main; use Task 6 or 7, milestone ID, Refs #issue, allowed-path confirmation, checks/output/sources and remaining items. Request kaalakhatta review. Closes only when the full cumulative task is complete.
- If scoped instructions and a tool's defaults conflict, stop the unauthorized step and report it. Instruction files guide behavior; GitHub scope checks plus human review are the backstop, not a local filesystem sandbox.

## Handoff when free-agent limits are reached

Before changing tools/sessions, save STATUS.md and record the exact branch/PR, last validated commit, unfinished checklist and blockers. The next agent reads them and resumes the same task. If releasing to another collaborator, document the handoff before /unclaim. Never create a second task or claim another contributor's role to work around a model limit. Don't mark blocked work complete.

## Readiness checklist for the owner

- [ ] PR #12 human-reviewed and merged; main contains this guide and tasks.json
- [x] Actions enabled; active main ruleset requires web and scope (verified 2026-10-05)
- [ ] Kanika can clone with her account and successfully claim #9
- [ ] Yashi can clone with her account and successfully claim #10
- [ ] Each agent reports the correct branch/two allowed directories before edits
- [ ] Real out-of-scope PR is blocked by required scope protection (use a harmless temporary test PR; owner deletes/closes it)
- [ ] No agent can merge under the agreed human-only workflow; no shared credentials

Only externally verified checks are marked passed. Repo entry files are prepared; actual teammate-agent sessions and post-merge claims still need verification.

Instruction-format sources checked 2026-10-05: [Antigravity rules](https://www.antigravity.google/docs/rules/) and [OpenCode rules](https://opencode.ai/docs/rules/). Compatibility with other tools is provided by explicit prompts, not a claim that every agent auto-loads instructions.
