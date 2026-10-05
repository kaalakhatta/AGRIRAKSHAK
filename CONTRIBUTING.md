# Contributing

## Workflow

1. Pick or create a GitHub issue with a clear acceptance check.
2. Create a short branch such as `feat/upload-flow` or `ml/baseline-mobilenet`.
3. Keep code, content, and model experiments in separate commits where practical.
4. Run `npm run check` before opening a pull request.
5. Link evidence such as screenshots or metrics in the pull request.

Do not commit datasets, raw user photos, secrets, notebook outputs, or large model checkpoints. Add approved model releases through GitHub Releases when needed.

## Content review

Disease descriptions and prevention guidance require a source. Treatment-related content requires review by the named faculty or agriculture reviewer before it can be marked approved.

## Model changes

Every proposed model must record its dataset version, split seed, preprocessing, class list, per-class metrics, field-image results, model size, and browser latency.

## Farm-context team: claim before editing

The active roster and issue numbers are in `docs/farm-context/tasks.json`; read root `AGENTS.md` and your complete task brief. On your assigned issue, comment exactly `/claim`. Wait for the bot's “Claim confirmed” and your GitHub assignment before starting. Only the mapped collaborator account can claim. `/unclaim` is restricted to the assignee or Arindam; record remaining work and the existing branch/PR before release.

Use the exact registered branch from latest main, or resume it if it exists. One active agent per contributor account and one writable checkout per task. Claims reserve issues; they do not create branches or prevent two sessions using the same account. GitHub can supersede pending concurrency runs: retry only if no confirmation arrives. Do not assume a posted command succeeded.

The claim workflow activates only after the human owner merges this setup PR into main. Before then Arindam may manually assign the issue and explicitly authorize work. The scope workflow rejects teammate PRs outside their task paths, including renames, or from the wrong account/branch. Make `Team task scope / scope` a required branch-protection check after activation; enforcement through protection requires human owner configuration. It coordinates only registered phase tasks, not arbitrary repository work.

Every PR includes task number, `Closes #<issue>`, scope confirmation, validation evidence, sources, and remaining TBDs. Request kaalakhatta review. Agents never merge or push main.

## Whole-companion milestone delivery

Read `docs/farm-companion/BUILD_PLAN.md`, `DATA_MODEL.md`, `RECOMMENDATION_ENGINE.md` and `DELIVERY.md`. Work through M0–M5 with small reviewable slices. Use `Refs #<task issue>` for intermediate PRs; reserve `Closes #<task issue>` for the entire completed cumulative assignment. This overrides any earlier requirement to close the issue for each partial PR.

Zero paid APIs, subscriptions, paid AI endpoints or card-required dependencies. No mandatory hosted database/authentication. Core profiles/records/calendar work locally with export/import/delete; photos and precise coordinates are not retained by default. Region/crops/reviewer unknowns remain TBD and evidence-dependent advice abstains. Share reviewed catalog/contracts through PRs before integration; no simultaneous owner edits in teammate directories.
