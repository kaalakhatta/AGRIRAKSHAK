# Task 7: Evidence research and seed/action catalog

Contributor: Yashi
Branch: `codex/farm-task-7-yashi` (one active agent/checkout only)
Allowed path: `docs/research/farm-context/**`

GitHub issue: https://github.com/kaalakhatta/AGRIRAKSHAK/issues/10

## Start and claim

Read root AGENTS.md, docs/farm-context/PLAN.md, docs/farm-context/CONTRACT.md and every existing file in your allowed directory. Find your issue in docs/farm-context/tasks.json. Post `/claim` and wait for the bot to confirm assignment. Do not begin edits on a pending, failed or rejected claim. Your GitHub account is mapped in the registry; if it differs, contact Arindam. Create the exact branch above from latest origin/main, or resume that branch for the same active issue; never reset existing work.

Additional allowed path: `data/catalog/farm-context/**`. Keep a STATUS.md in each owned directory.

## Full companion scope

Read docs/farm-companion/BUILD_PLAN.md, DATA_MODEL.md, RECOMMENDATION_ENGINE.md and DELIVERY.md. Work incrementally through M0–M5; keep these milestone IDs and remaining checklists in STATUS.md. No paid API, subscription, card-required service or paid AI tooling. Preserve the existing context v1; farm records need separate versioned contracts.

## Work

Research primary sources for location-based weather, mapped soil properties, actual sensor telemetry, and regional crop/seed suitability. Deliver SOURCES.md, PROVIDER_MATRIX.md, CLAIMS_REGISTER.md, and REVIEW_GAPS.md.

Verify and open at least eight primary sources. Include official Indian agriculture/ICAR/state agricultural university guidance for crop or seed suitability where available. Record region, crop, season, date, source URL, supported claim, limitations, license/attribution, API availability, rate limits, pricing and access date. Open-Meteo is the free non-commercial weather candidate. SoilGrids REST is currently paused; its maps are regional background, not suitable field measurements. Verify current primary documentation; no paid provider is eligible. Explicitly distinguish weather model estimates from station/sensor readings and mapped soil from soil tests. No product endorsements or invented seed rankings. Target district, crops, expert reviewer, and seed availability remain TBD until supplied.

Validation: manually open each citation; check every claim maps to a source and every unknown is TBD. Provide the verification checklist in the PR.

## Additional work in the second allowed directory

Create seed.schema.json, action.schema.json, CONTENT_GUIDE.md, examples/, and a documented validation method within your directory. Schemas must represent stable IDs, crop/variety, region, season/sowing window, soil needs with units and depth, water availability, evidence links, contraindications, missing inputs, localized text, and review state (draft/reviewed/rejected). Actions cover sowing, irrigation planning, monitoring, soil testing, and expert referral. No pesticide or fertilizer dosages.

All examples are draft placeholders or verified source-backed drafts. Reviewer name and review date are null until reviewed. Avoid fabricated seed suitability thresholds. Define structured conditions, evidence IDs, and reasons so Arindam can consume records without parsing prose. Recommendation records must express when to abstain. JSON examples must validate; schema validation tooling may be documented as an external free CLI, with no root dependency changes.

Validation: validate all examples against their schemas using the documented tool; include output, verified sources, and review gaps.


## Companion milestones: evidence and content only

- M0–M1: sources/provider matrix, region/crop coverage definitions and draft schemas. Read the full engine rule shape before finalizing action.schema.json; coordinate operator/unit interfaces with Arindam through the issue.
- M2–M3: add crop.schema.json, calendar.schema.json and evidence.schema.json alongside seed/action schemas; draft crop-stage task templates, seed comparison facts and contraindication/missing-input text. Do not fabricate crop dates, thresholds or suitability.
- M4: reviewed-source soil/establishment/harvest/post-harvest content and plain-language explanations. No fertilizer/pesticide dosages or economic outcome claims.
- M5: COVERAGE.md maps supported region/crop/language/topics to sources and real reviewer status; REVIEW_PACKET.md documents items needing faculty/agronomy review. Translation priorities remain TBD; no invented approval.

Broad platform topics do not require a nationwide catalog. Complete a few crops in the selected region first. While crops/region/reviewer are TBD, schemas, source inventories and explicitly draft examples can proceed; reviewed runtime advice remains blocked. Do not implement web UI, engine, adapters or model training.

## Cumulative work and handoff

Inspect the issue checklist, linked PRs and current allowed directory to continue unfinished items. Previous task briefs 1–4 are preserved as historical backlog; this issue is the active assignment. Do not silently combine the old tasks with this one. Keep STATUS.md within your allowed directory (Arindam: docs/farm-context/CORE_STATUS.md) with completed items, remaining work, validation evidence and blockers. Close completion gaps before proposing new scope.

## Submission

Show the diff, commit and push only the task branch, open a PR to main with milestone ID and `Refs #<issue>` for partial delivery; use `Closes #<issue>` only once the full cumulative assignment is complete, request kaalakhatta review, include Task 7, changed paths, commands/output, sources, limitations and confirmation of allowed scope. Never merge. If handing over unfinished work, document the branch/PR in the issue before `/unclaim`. A claim reserves one contributor task; it does not create a branch or permit two agents for one account to edit simultaneously.
