# Arindam: Task 10 core build status

Branch: codex/farm-task-10-arindam. Cumulative issue: #11. Current milestone: M4 soil, expense and harvest diaries plus M3 personal calendar, timeline and next-step board ready for review; reviewed catalog, real model integration and on-device weather success remain pending.

## Completed

- M0: setup merged, real /claim confirmed by GitHub Actions and issue assigned to kaalakhatta. Main ruleset was subsequently disabled at the owner's explicit request; scope CI still runs, but branch protection is not enforced. Do not restore/change that setting without owner direction.
- M1: /farm screen with field/farm creation/editing, area/unit/region/water inputs; crop-cycle create/edit/status/date/stage inputs; multiple fields/cycles; local IndexedDB persistence.
- M1: GPS request/manual coordinates/skip, explicit field confirmation, transient-by-default coordinates, opt-in local retention and independent coordinate removal.
- M1: versioned and bounded validation, coordinate-free default backups, previewed imports, explicit conflict choices, idempotent import, transactional saves and stale-tab conflict prevention.
- M1: field/cycle/all-record deletion previews; field deletion cascades to its cycles; unknown future data/database versions reject without erasure.
- M1: responsive page and navigation from existing scanner, focused deletion/next-cycle affordances, twelve domain/storage tests wired into npm run check.

- M2: /today and embedded selected-field overview; separate weather-sharing consent/revocation; direct Open-Meteo weather adapter, unit/time/interval validation, bounded retries, rate-limit handling and transient cache.
- M2: declarative engine-1 handoff contract; full catalog validation, reviewed/evidence gates, applicability, required input provenance/unit/depth/interval/freshness, synthetic and cross-field blocking, conflict suppression. Runtime catalog is empty pending real reviewed content.
- M2: record-quality prompts, honest unavailable soil/sensor states and source attribution. No dependencies added.

- M3 partial: /plan personal date/sowing/stage reminders, create/edit/done/reopen/deletion preview, Today due reminders, cycle-change rescheduling preview/choice with completion preservation.
- M3 partial: schema-2 snapshot/backup contract, tested non-destructive schema-1 migration, reminder import conflicts and deletion cascades. No new dependencies or catalog advice.

- M3 partial: explicit cycle/unlinked demo-summary save, /records timeline and filters, no photo/filename/location/prediction/confidence retained, deletion preview, schema-3 backup/snapshot migration preserving schema-1/2 data.

## Evidence

See ../farm-companion/M1_VALIDATION.md. npm run check passes lint/typecheck/12 tests/production build. Browser tests used synthetic records only: save/reload, crop persistence, manual-confirmation block, session-only versus retained location, invalid import rejection, valid preview/merge/reload and conflict-choice gate. Screenshots captured outside Git; no farmer photos/locations or model artifacts were committed.

M2: npm run check passes lint/typecheck/23 tests/production build. Live provider smoke with synthetic 0,0 returned HTTP 200 and passed parsing; Origin header received access-control-allow-origin: *. In-app browser verified field/cycle selection, disabled fetch before consent, no-location fallback, fetch failure isolation, revoke/reset and reload privacy. Browser live fetch failed; success rendering and physical-mobile accessibility remain pending QA. See ../farm-companion/M2_CONTRACT.md.

M3 partial: npm run check passes lint/typecheck/30 tests/build. Browser synthetic records verified reminder persistence/completion and cycle rescheduling gate: pending moved only after choice, completed unchanged. See ../farm-companion/M3_CALENDAR.md.

M3 timeline: npm run check passes lint/typecheck/35 tests/build. Browser generated green-PNG demo verified explicit cycle/save gate, repeat-save disabling, labelled linked timeline and reload persistence. See ../farm-companion/M3_TIMELINE.md.

## Remaining

- Human review/merge of M1 PR; independent GPS permission-denied/unavailable and physical-phone/accessibility/storage-failure QA.
- Validate actual exported-file delivery on exhibition browsers; export transformation is unit-tested and browser dispatch/status was observed, but the in-app download event could not be captured.
- M2: teammate catalog schema agreement and human-reviewed catalog integration; successful browser weather request/render on exhibition devices. Session cache is not offline installation. Engine uses exact normalized units; broader conversions/optional rules need reviewed contracts.
- M3: reviewed seed/crop identifiers and matching, reviewed calendar templates, recommendation feedback/snooze/deduplication, evaluated model integration and real uncertainty timeline contract. Personal reminder calendar and demonstration timeline are implemented. Existing main scanner remains a clearly labelled interface simulation; actual inference work on other branches is not silently replaced/integrated here.
- M4/M5: broader season summaries and release QA, offline caching and exhibition release. Soil notebook is implemented; engine eligibility integration still awaits reviewed methods/rules.
- Region/crops/reviewer/date/devices/language remain TBD. No seed advice, weather or yield gain is fabricated in M1.

## Handoff

Read full Task 10 brief and current PR before continuing. M2 owner handoff is ../farm-companion/M2_CONTRACT.md; current cumulative PR is #13. M1 runtime contract is apps/web/lib/domain/farm.ts, separately versioned from context v1. Cycles currently store farmer-entered crop/variety text; matching to reviewed catalog IDs is an M3 migration/integration step. FarmData/backups now use schema 7; schema-1–6 files migrate non-destructively with empty observations, empty sales for schema 1–5, empty expenses/harvests for schema 1–4, empty soil tests for schema 1–3, empty scans for schema 1/2 and empty reminders for schema 1. See M3_CALENDAR.md, M3_TIMELINE.md, M4_SOIL.md M4_SEASON_RECORDS.md, M4_SEASON_REVIEW.md and M4_OBSERVATIONS.md before changing storage or downgrading. Unknown future versions fail closed. Do not edit teammate-owned directories or untracked services artifacts. Never close cumulative #11 for this milestone.

## Personalized next-step board

Today now derives explainable preparation suggestions from the selected field/cycle, personal reminders and weather freshness. Focus filters cover crop planning, water/weather and season tracking. Due personal reminders appear first; completed and foreign-cycle tasks are excluded. Missing sowing anchors, region/season/water and active-stage records produce direct navigation to the relevant forms. Fresh weather is summarized without agronomic thresholds; stale estimates prompt refresh. Synthetic field/cycle labels remain visible. No seed, irrigation or nutrient prescriptions are generated from this preparation layer; the reviewed catalog remains pending. Feedback persistence and reviewed agronomic suggestions remain unfinished.

Validation for next-step board: npm run check passes lint/typecheck/39 tests/production build. Four added tests cover missing inputs and immutability, due/completed/foreign-task isolation, foreign-field cycle exclusion, and fresh/stale weather with null versus zero. Browser synthetic field verified focus filtering and expanded input explanations; screenshot stored outside Git. No new dependency or persistence schema.


## M4 partial: soil notebook

Records provides separate Soil tests and Screening timeline views so each reloads the current snapshot when selected. Soil tests belong to fields and retain sampling date, source kind/name, optional depth and method, and explicit pH/g_kg/percent readings. Synthetic values remain labelled and excluded from measured-data preparation prompts. Edit, deletion preview, backup/import/conflicts and field deletion cascade are implemented; deleting a crop cycle keeps field soil history. No NPK, automatic report upload, unit guessing, agronomic ranges, freshness certification or dosage advice. Physical input bounds are data validation only. Future sample dates and post-creation samples reject in the field timezone.

Validation: npm run check passes lint/typecheck/47 tests/build. Eight soil tests cover unknown versus zero, metric/unit/source/depth validation, timezone/reference checks, v1–v3 migration, round-trip/conflict import, field/cycle cascade, IndexedDB persistence/stale writes, and synthetic/foreign-field exclusion. Browser synthetic sample verified save, edit, reload, incomplete-depth rejection, delete-preview cancellation and preservation of the existing scan timeline. No actual browser deletion executed; cascade behavior is unit-tested. Backup file delivery and device QA remain pending. See ../farm-companion/M4_SOIL.md.


## M4: expense and harvest diaries

Records now includes per-cycle Expenses and Harvests. Both support create/edit, local persistence and deletion previews. INR amounts use validated integer paise and exact aggregate arithmetic; refunds are explicit positive amounts subtracted from recorded costs. Summaries show recorded costs/refunds/net outlay and category totals, with incomplete-cost warnings and no profit estimate. Harvest events support g/kg/tonnes weights and whole piece counts separately, plus optional harvested area. Per-picking kg/ha needs explicit mass and area; missing area stays unavailable, field area is not substituted and repeated areas are never summed into a season denominator. Planned cycles and harvests preceding known sowing dates reject. Demo records are labelled and totalled separately from real entries.

Schema-5 backups/snapshots add expenses and harvests; legacy v1–v4 normalize safely. Imports preview conflicts/idempotent repeats; deleting a cycle or field cascades its season entries while cycle deletion preserves field soil. No new dependencies, currency/price APIs, sales inference or agricultural guidance.

Validation: npm run check passes lint/typecheck/57 tests/build. Ten season tests cover exact paise parsing/sums, refunds, large totals, unit conversions, separate counts, missing/overflow denominators, privacy stripping, dates/references/planting status, v1–v4 migrations, imports/cascades and atomic IndexedDB persistence/stale-write rejection. Browser synthetic records verified ₹125.50 cost, refund edit to ₹25.30 and ₹100.20 outlay; a fractional-paise edit rejected without replacing saved values. Harvest checks verified 100 kg + 500 g = 100.5 kg, pieces separately (edited from 3 to 4), a 1,000 m2 per-picking denominator and explicit unknown area. Both diaries survived reload; deletion previews were opened/cancelled. No permanent browser deletion executed. See ../farm-companion/M4_SEASON_RECORDS.md. Device QA and actual exported-file delivery remain pending.


## M4: sales and season review

Records adds Sales and Season review. Sales retain crop cycle, local date, positive sold quantity/unit, exact positive INR received amount and optional plain-text note. They support edit, deletion preview and revision-checked local persistence. The UI explains cash received versus unpaid invoices/deposits, and asks users to edit the same sale for later payments to avoid counting quantity twice. Sales can be entered when harvest diaries are incomplete; planned cycles and dates before known sowing reject. No buyer identifiers, price APIs or inferred revenue.

Season review compares cost/refund totals, gross receipts, net outlay and recorded receipts-minus-outlay only when a cost and sale exist. Missing costs/sales stay unavailable; refund-only records do not establish cost coverage. Matching weights normalize g/kg/t to kg; pieces stay separate. Diary differences are not stock, and sold totals above partial harvest records produce a correction prompt rather than a blocked save. Missing harvest areas and numeric overflow stay visible. No whole-season yield denominator, profit estimate, forecast or causal improvement. Synthetic records and records under synthetic farm/field/cycle parents are separated from real totals.

Schema 6 (farm-m4-v6) adds required sales; legacy v1–v5 snapshots/backups migrate without losing older diaries. Sale IDs/dates/references/units validate, imports are idempotent/conflict-aware and cycle/field deletion cascades sales. Privacy defaults are unchanged. Older builds cannot read v6; retain a backup before downgrading.

Validation: npm run check passes lint/typecheck/67 tests/production build. Ten additional tests cover sale validation/privacy, planting/local dates, exact large and negative/zero balances, refund-only/missing data, weight/count differences and floating-point noise, overflow, cycle/demo isolation, v5 migration/old-schema hidden arrays, private imports/conflicts/cascades and atomic IndexedDB persistence/stale-write rejection. Browser synthetic QA saved and edited sales, rejected fractional paise without replacing saved values, kept count/weight entries separate, opened/cancelled sale deletion preview and verified all diaries after reload. Review showed ₹1,550.45 receipts, ₹200.50 costs, ₹25.30 refunds, ₹175.20 net outlay and ₹1,375.25 recorded difference; harvested 100.5 kg / 4 pieces versus sold 60 kg / 2 pieces. The earlier no-cost review showed an unavailable balance. No permanent browser deletion or real financial transaction was performed. Screenshot is outside Git. Physical-device QA and exported-file delivery remain pending. See ../farm-companion/M4_SEASON_REVIEW.md. Dated observations are implemented in the follow-up below; broader efficacy summaries still need reviewed rules and adequate records.


## M4: dated observations and field notes

Records now includes Observations. Notes belong to a crop cycle/field, retain a local date, required plain-text note (up to 1,000 characters), optional descriptive tags and an optional same-cycle screening reference. Create/edit, tag filtering, newest-date-first history and deletion previews use local revision-checked persistence. Notes may describe a preplant field visit and do not require a planted cycle. Future/post-creation dates, unknown/duplicate tags, missing cycle references and foreign/unlinked screening references reject. HTML-looking text renders literally. No retained images, diagnosis, confidence or automatic treatment/recommendation trigger.

Demo parents and demo screening references mark observations synthetic; editing or removing a screening reference cannot remove an existing demo origin. Deleting a screening detaches references while preserving linked notes and synthetic provenance, in the same transaction. Cycle/field deletion cascades their observations. Season review displays real/demo observation counts and latest dates separately; notes do not establish crop health, profit or yield causality.

Schema 7 (farm-m4-v7) adds required observations. Matching legacy v1–v6 snapshots/backups normalize non-destructively; imports preview additions/conflicts and repeats are idempotent. Old schemas with hidden observations, unknown versions and invalid links fail without writing. Export/import/delete previews include observation counts. Older builds reject v7; retain a backup before downgrading.

Validation: npm run check passes lint/typecheck/77 tests/production build; git diff --check. Ten added tests cover bounded text/tags/privacy, local dates and preplant notes, same-cycle screening references, demo-parent/link exclusion, chronology/immutability, screening deletion detach/provenance, v1–v6 migration/version guards, private backup/conflicts/cascades, IndexedDB v6 migration/persistence/stale/invalid writes and review counts without financial/health inference. Browser synthetic QA saved two notes dated Oct 6/7, edited text/tags, linked the older note to its existing interface demo, rejected whitespace-only edit without replacing saved text, verified literal HTML-looking text, tag filtering, newest-first ordering, deletion-preview cancellation and reload persistence. Review showed two synthetic observations/latest Oct 7 alongside preserved earlier expense totals; missing sales stayed unknown. No permanent browser deletion performed; detach/cascade behavior is unit-tested. Screenshot remains outside Git. See ../farm-companion/M4_OBSERVATIONS.md.

M4 runtime modules are now present; physical-device acceptance, actual exported-file delivery and independent Task 6 QA remain open. Next owner implementation slice: persist feedback for the explainable preparation suggestions on Today, while reviewed agricultural guidance and real model integration stay gated on their pending inputs.
