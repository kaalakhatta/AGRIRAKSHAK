## Outcome

Describe the user-visible or research outcome.

## Evidence

- [ ] Screenshots or recording for UI changes
- [ ] Metrics and experiment reference for model changes
- [ ] Sources and reviewer status for agriculture content

## Checks

- [ ] `npm run check` passes
- [ ] No datasets, secrets, personal photos, or large checkpoints are committed
- [ ] Safety and low-confidence behavior remain clear

## Self-merge

Follow [the standing own-PR authorization](../docs/team-tasks/SELF_MERGE.md).
Review the complete diff and evidence, fix blockers, then change the line below to
`Self-review: complete`. After all five current-head checks pass, the author’s agent
runs `node .github/scripts/self-merge.cjs PR_NUMBER` without asking the owner again.

Self-review: pending
