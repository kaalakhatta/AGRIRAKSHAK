# Standing authorization: agents merge their own eligible PRs

Arindam requested this policy on October 9, 2026. It supersedes the earlier human-only merge clauses in historical notes. Arindam authorizes each registered contributor’s agent to finish the task branch’s PR and merge it through that contributor’s own mapped GitHub account once eligible. No repeated owner confirmation or mandatory owner approval is needed. Request kaalakhatta review for visibility; honor actual requested changes and GitHub requirements. This is authorization for your own task PR, not other contributors’ PRs, main pushes, protection bypasses, releases or deployments.

## Finish the slice and merge

1. Verify your active bot-confirmed claim, exact registered branch and exclusive paths. Use your own write-enabled GitHub account and separate checkout.
2. Run the brief’s checks, inspect the whole PR diff, fix known blockers, verify sources/evidence and update STATUS.md. CI is not proof of device tests, training runs, accuracy or agronomy review. Keep missing evidence explicit. Add `Self-review: complete` on its own line in the PR body only after this review; include `Refs #issue` for partial delivery.
3. Reconcile current main into the task branch without resetting/force-pushing. Push your task branch and wait for `web`, `api`, `ml-unit`, `scope` and `tests` to pass on that head. If main changes, reconcile and rerun CI.
4. From an updated checkout, run the guarded command. The optional check mode is read-only:

```bash
node .github/scripts/self-merge.cjs PR_NUMBER --check
node .github/scripts/self-merge.cjs PR_NUMBER
```

Replace PR_NUMBER with your PR number. The command reads the registry from canonical main through GitHub, checks your identity/permission/claim and all changed paths (including rename sources), current-main ancestry, full current-head checks, review decisions/discussions and clean mergeability. It rechecks main/head and uses `--match-head-commit` for the final merge. It never uses `--admin`, prints tokens, executes PR content or deletes the task branch. Treat an unavailable/unknown/pending check as blocked; wait, fix or record the blocker. Do not merge directly to evade the guard.

5. Verify GitHub reports the PR merged; record its URL/commit/check evidence and next work on your task issue. Keep a partially completed cumulative issue open. Fetch/reconcile main before the next slice; if GitHub deleted the branch, recreate the same registered branch from current main after verifying the prior PR merged. Never resurrect a stale branch by blindly pushing it. Attach created PRs to your chat where supported.

The author’s agent performs this automatically as part of completing its work, without asking Arindam to click Merge. An unattended background merge bot is not installed. GitHub auto-merge is already enabled, but the existing main ruleset remains disabled; the command checks eligibility at execution time and does not replace server-enforced branch protection. Concurrent changes after verification can still require reconciliation; never override GitHub’s rejection. Account authentication/tool approval limits are actual blockers, not reasons to use another person’s token.

Arindam owns this protocol and its command/tests; teammates may execute/read them but keep edits in their own allowed paths. Governance/shared-path changes still go through owner integration. Existing human-only history is preserved as history; all active briefs and scoped instructions use this standing policy.

References: [GitHub CLI merge and expected-head option](https://cli.github.com/manual/gh_pr_merge), [GitHub check-run API](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference).
