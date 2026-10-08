# Arindam: Task 10 core build status

Branch: codex/farm-task-10-arindam. Cumulative issue: #11. Current milestone: M4 records/review and M3 personal calendar, timeline, next-step board, preparation feedback and planning framework are merged through #19; reviewed catalog, real model integration and on-device weather success remain pending.

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

- Core PR #13 is merged; independent GPS permission-denied/unavailable and physical-phone/accessibility/storage-failure QA.
- Validate actual exported-file delivery on exhibition browsers; export transformation is unit-tested and browser dispatch/status was observed, but the in-app download event could not be captured.
- M2: teammate catalog schema agreement and human-reviewed catalog integration; successful browser weather request/render on exhibition devices. Session cache is not offline installation. Engine uses exact normalized units; broader conversions/optional rules need reviewed contracts.
- M3: reviewed seed/crop identifiers and matching, reviewed calendar templates, reviewed-action feedback integration, evaluated model integration and real uncertainty timeline contract. Personal reminder calendar and demonstration timeline are implemented. Existing main scanner remains a clearly labelled interface simulation; actual inference work on other branches is not silently replaced/integrated here.
- M4/M5: broader season summaries and release QA, offline caching and exhibition release. Soil notebook is implemented; engine eligibility integration still awaits reviewed methods/rules.
- Initial focus is Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. Exhibition is October 9, 2026, approximately 14:00 IST (candidate-freeze target 08:00 IST); reviewer/devices/language remain TBD. No seed advice, weather or yield gain is fabricated in M1.

## Handoff

Read full Task 10 brief and current PR before continuing. M2 owner handoff is ../farm-companion/M2_CONTRACT.md; core PR #13 and subsequent integration/planning PRs #18/#19 are merged. Current task/setup evidence is in STATUS.md. M1 runtime contract is apps/web/lib/domain/farm.ts, separately versioned from context v1. Cycles currently store farmer-entered crop/variety text; matching to reviewed catalog IDs is an M3 migration/integration step. FarmData/backups now use schema 8; schema-1–7 files migrate non-destructively with empty feedback, empty observations for schema 1–6, empty sales for schema 1–5, empty expenses/harvests for schema 1–4, empty soil tests for schema 1–3, empty scans for schema 1/2 and empty reminders for schema 1. See M3_CALENDAR.md, M3_TIMELINE.md, M4_SOIL.md M4_SEASON_RECORDS.md, M4_SEASON_REVIEW.md and M4_OBSERVATIONS.md and M3_FEEDBACK.md before changing storage or downgrading. Unknown future versions fail closed. Do not edit teammate-owned directories or untracked services artifacts. Never close cumulative #11 for this milestone.

## Personalized next-step board

Today now derives explainable preparation suggestions from the selected field/cycle, personal reminders and weather freshness. Focus filters cover crop planning, water/weather and season tracking. Due personal reminders appear first; completed and foreign-cycle tasks are excluded. Missing sowing anchors, region/season/water and active-stage records produce direct navigation to the relevant forms. Fresh weather is summarized without agronomic thresholds; stale estimates prompt refresh. Synthetic field/cycle labels remain visible. No seed, irrigation or nutrient prescriptions are generated from this preparation layer; the reviewed catalog remains pending. Feedback persistence is implemented in the M3 follow-up below. Reviewed agronomic suggestions remain unfinished.

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

M4 runtime modules are now present; physical-device acceptance, actual exported-file delivery and independent Task 6 QA remain open. Preparation feedback is implemented below. Reviewed agricultural guidance and real model integration stay gated on their pending inputs.


## M3: saved preparation feedback and follow-ups

Today supports pending/done/snoozed/not-applicable/needs-help feedback for generated preparation steps, with optional plain-text notes, editing, reopening and a saved-follow-up view. Done and not-applicable steps leave the active list; snoozed steps return on the chosen farm-local day; needs-help remains active. Users can show handled steps. Help and snooze are local records, with no message or notification sent. Actual calendar task completion/rescheduling stays in Plan; done on a due-reminder suggestion is labelled Reminder reviewed.

Each response binds field/cycle, preparation generator version, real/demo mode, exact card content and relevant source revisions. Repeated saves update one context's stable ID; changed inputs create a new context and retain previous responses as history. Historical responses do not hide new suggestions. A form whose inputs change blocks saving until the user reviews/accepts the current inputs; draft notes are kept. Personal reminder due-to-overdue display changes do not cancel a valid snooze, while actual schedule/revision changes invalidate feedback. Field/cycle/task demo provenance is preserved and cannot hide real suggestions.

Schema 8 (farm-m3-v8) adds required feedback. Matching legacy v1–v7 normalize non-destructively. Feedback validates allowlisted prep-step IDs/statuses, bounded note/title, strict input-key scope/shape, field/cycle references, duplicate logical contexts and snooze day. Only future snooze dates relative to the response recording day are valid; old snoozes remain readable and become active at expiry. Imports preview responses/conflicts, repeated imports are idempotent and field/cycle deletion cascades their feedback (cycle deletion keeps field-only feedback). Photos and structured coordinates are not copied into response keys. No new dependency or change to the reviewed-advice gates.

Validation: npm run check passes lint/typecheck/87 tests/production build; git diff --check. Ten new tests cover invalid statuses/step versions/keys/snoozes, stable-ID updates and immutability, active/hidden/expired behavior with local-day boundaries, changed-input/old-form rejection, field/cycle/no-cycle/demo isolation, personal reminder schedule invalidation without Plan completion, privacy/key payload rejection, v1–v7 migration/duplicate/version guards, import conflicts/cascades and atomic IndexedDB v7 migration/stale writes. Missing fields remain unknown and source gates remain independent of feedback.

Browser synthetic QA saved done on seed-preparation (active list 4→3), reopened it without duplicating the record (3→4), edited to needs-help with a literal HTML-looking plain-text note, snoozed water-record preparation until Oct 9 and verified hidden/handled display. Switching to a second cycle showed its unaffected steps and zero saved responses. Reload preserved the original two feedback records, needs-help badge and snooze/date/note; records remained visibly synthetic. No weather consent, outbound help message or permanent deletion performed. Changed-source/expiry/stale-write cases were tested with deterministic fixtures, not by altering the user's records or waiting for a real date boundary. Physical-device QA and exported-file delivery remain pending. See ../farm-companion/M3_FEEDBACK.md. Next implementation slice: offline availability/update behavior and backup/recovery QA for the local companion.


## Earlier owner reassignment: 2026-10-08 (superseded below)

User restored Anushka/Aanya and requested a larger Yashi bundle. Task 7/#10 now owns all docs/research and data/catalog through nine ordered Y1–Y9 packages, including preserved literature PR #14 and disease/quiz frameworks. Task 6/#9 focuses on farm-data audit/regression expectations. New Task 11/#15 reserves dataset integrity/leakage/model readiness audit for AnushkaSChandel; Task 12/#16 reserves device/accessibility/failure QA and presentation/rehearsals for aanya25bce11372-stack. Both invitations were pending; new claims and actual device/artifact evidence remain unverified. Arindam retains Task 10/#11 runtime integration.

Registry, root/nested instructions, full briefs, roadmap/ownership docs, startup prompts and issue checklists align. All four teammates have disjoint exclusive directory pairs. Historical Tasks 1–4/PR #14 are preserved and their applicable deliverables feed current tasks. No teammate deliverables are marked implemented by this setup update.

Validation: node --test tests/task-claim.test.cjs passes 12 tests (including real-registry mapped-account/isolation, returning-user write-access gate and unique/disjoint scopes); git diff --check passes. Registry-to-brief/path/link verification passes for five mapped tasks and four disjoint teammate directory pairs. No runtime changes or dependencies in this reassignment; existing uncommitted offline/UI edits and services model artifacts remain outside the commit.

Activation: the updated registry must merge into main before Tasks 11/12 claims and expanded Task 7 scope work. Existing Task 7/10 bot claims remain valid; Kanika has no confirmed bot claim. Live main protection ruleset was observed disabled; no protection/bypass settings were changed. Next independent contributor actions: invitation acceptance and verified /claim; Yashi recovers PR #14 on the registered branch; audits/QA/content work proceed in their separate scopes.


## Sehore intelligence and revised training ownership: 2026-10-08

Owner takes back catalogs and the major farm intelligence. Yashi retains Task 7/#10 on codex/farm-task-7-yashi and owns the eight explicit research/ML scopes for free Colab, training, calibration, evaluation, ONNX export and supporting evidence. Anushka independently audits; Kanika and Aanya retain their distinct assignments. Claims for #10/#11 remain confirmed; current issue bodies preserve the prior assignments. No training work or metrics were fabricated by this update.

Initial focus: Sehore, Madhya Pradesh, with soybean, wheat and gram/chickpea; agronomy reviewer remains TBD. farm-guidance.ts now binds the saved field/cycle and fresh same-field weather to engine-1, uses explicit crop/region aliases, keeps stage confirmation time, blocks demo parents, and excludes inferred soil, forecast issuance and scan confidence. Today and Plan show readiness/abstention reasons. Runtime catalog remains empty; only matched reviewed fixtures prove the path in tests. Current training selects pepper/potato/tomato, so target-crop scanner coverage is not established. See ../farm-companion/SEHORE_INTELLIGENCE.md.

Validation: isolated staged snapshot npm run check passed lint/typecheck/97 app tests/production build; node --test tests/task-claim.test.cjs passed 16 tests; git diff --check passed. Exact-file ML scopes cannot admit suffix filenames, traversal or outside rename sources. Existing offline/UI dirty work and services model artifacts are excluded from this PR. Next: genuine agronomy review and source-backed catalogs/seed-calendar contracts; Yashi target-crop dataset feasibility and actual Colab execution; independent model/device QA. This partial milestone does not close #10/#11.

Browser smoke on the isolated production build: created explicitly named synthetic Sehore/Soybean/Kharif records through the forms, selected the cycle in Today, then reopened the saved field/cycle in Plan. Both rendered the focus and missing-water/weather/reviewer reasons; Plan retained the personal reminder form and did not render crop actions. No GPS/weather permission or outbound provider request was used. This is desktop UI evidence, not physical-device or model QA.

Scope CI bootstrap repair: the first run tried loading the new helper from the trusted base before it existed. The workflow now checks mapped author/claim before recognizing existing repository-wide owner scope, and loads the trusted helper for restricted tasks. Two workflow-execution tests cover owner bootstrap with missing helper, rejected author/claim, exact-file boundaries and both rename sides.


## M3 partial: seed comparisons and reviewed schedule previews — 2026-10-08

Added planning-1 catalog types/validator, free authoring CLI and content guide. Plan uses separate alphabetic seed comparisons and sowing-window/confirmed-stage previews, with evidence/reviewer/input/caution metadata. Missing water/season/soil/time, draft/unverified content, wrong field/crop/region, demo parents, stale stage, passed windows and conflicts abstain. Calendar previews never modify personal reminders or completion history; runtime catalog remains empty until real agronomy review. See ../farm-companion/M3_PLANNING.md and data/catalog/farm-context/CONTENT_GUIDE.md.

Validation on an isolated staged snapshot: npm run check passed lint/typecheck/109 app tests/production build. Claim/scope suite passed all 16 tests; catalog CLI accepted the empty authoring template; git diff --check passed. Browser smoke reused explicitly named synthetic Sehore/Soybean/Kharif records: missing-cycle prompt, separate unavailable seed/schedule sections, review/water/weather reasons and personal reminder form were visible. At 390 × 844 the page and document widths were both 390px and planner text wrapped without horizontal overflow. No location/weather permission, provider request, real model or new farmer data. This viewport check does not replace physical-device/accessibility QA.

Existing offline/backup/UI dirty work and services model artifacts remain excluded. This milestone has no new dependencies or farmer-record schema change. Next unfinished intelligence work: current source-backed seed/action/calendar content with real review, template-linked calendar adoption and feedback, soil input-method/time contract, and evaluated target-crop model handoff. Task 7 training remains Yashi's scope. No claim that reviewed guidance, target-crop scanning or the whole farm companion is finished; keep #11 open.


## M0 follow-up: task discovery and current setup evidence — 2026-10-08

Owner requested correction of the stale setup notes after Anushka could not find her active work. Live GitHub confirms registry #17 and training scopes #18 are merged, AnushkaSChandel has write access, and Aanya’s invitation remains pending. Task 10/#11 retains the owner’s mapped assignment and bot-confirmed claim. Kanika is assigned to #9 without an observed /claim or bot confirmation; that claim remains unverified.

Issue #15 is now owner-assigned to AnushkaSChandel for discoverability, and its stale invitation/activation text is corrected with direct main-branch brief/startup links. Her own /claim and bot confirmation remain required before editing. Issue #16 separately marks the registry merge complete and invitation/write access pending. No teammate claim was posted by the owner and no deliverable was marked complete.

Updated root/startup/task-index docs and current STATUS.md to reflect Yashi’s six Y1–Y6 packages and eight research/ML scopes, Arindam’s catalog/intelligence ownership, actual access/claim evidence and confirmed exhibition timing. Added direct issue/brief links and an explicit historical-issue reference note. Previous work and historical entries below their superseded heading remain preserved.

Validation: node --test tests/task-claim.test.cjs passed 16/16; git diff --check passed; local Markdown links and all five registry-to-brief mappings passed. SHA-256 checks confirmed all 54 existing unrelated modified/untracked files were unchanged. The task-discovery audit did not modify runtime files and did not rerun npm checks; its documentation fixes are now included with the combined exhibition PR #20. Runtime evidence comes from the following M5 integration section, while private model artifacts remain excluded.

Delivery: task-discovery corrections are included in the combined owner exhibition PR #20, not a separate documentation PR. Next: Anushka posts /claim as AnushkaSChandel and begins Task 11 A1 after confirmation. Aanya accepts her invitation; Kanika obtains confirmed claim evidence. Continue integration/model/device work in the existing registered scopes; reviewed guidance, target-crop model coverage and device/rehearsal passes remain unverified. Keep cumulative #11 open.


## Exhibition deadline and M5 local candidate — 2026-10-08

Owner confirmed presentation October 9 around 14:00 IST, requesting completion tonight/early morning. Prioritize a frozen candidate by 08:00 IST and actual-device rehearsal. See ../farm-companion/EXHIBITION_RUNBOOK.md and M5_EXHIBITION.md. All team issue bodies now carry the deadline and concrete priorities; existing claims/scopes remain unchanged and no pending audit/rehearsal is marked passed.

Home now leads with the farm companion and labelled Sehore sample records; Scan is a supporting /scan route. Six-page offline shell and backup preparation/readability checks are completed from the cumulative dirty work. Existing PR #6 camera/scanner and #7 API source were incorporated without replacing farm modules; real upload requires chosen supported crop and explicit consent, and an explicitly labelled interface mock remains optional. No automatic disease fallback or target-grain model coverage. Private model files stay untouched and ignored. Supplied baseline-v1 loaded locally with sixteen labels; synthetic transport/inference smoke is not field evaluation or accuracy evidence. Yashi retains training/evaluation/export; Anushka audits model/source gaps.

Local launch: npm run exhibition uses project .venv and loopback Next/API. Browser verified labelled sample creation, demo-bound Plan abstention/personal reminders, separated fictional season totals, actual six-screen cache preparation and Today/My Farm reload with both origin servers stopped. Real local API received the synthetic PNG and returned HTTP 200; unsupported/mismatched result text was suppressed. No real photo/GPS/weather data was used. Backup download link appeared; saved-file delivery remains an actual-device check. Camera/device rehearsals, reviewer/catalog entries and target-crop validation remain pending. Current full checks before freeze: 130 app tests/build plus sixteen API tests and Ruff. Keep cumulative #11 open; M5_EXHIBITION.md records boundaries.


## M0 owner account reassignment and Task 11 follow-up — 2026-10-08

Owner requested Aanya’s Task 12 be moved to n0debug and Anushka’s work be reviewed/merged with more follow-up work. n0debug collaborator write access is verified; registry, active prompts/briefs/status and issue #16 now use n0debug, preserving Task 12 branch/scopes. The old rejected /claim is historical; a new mapped-account /claim is required after the update is on main. No bot confirmation is fabricated.

PR #21 is partial A1–A3 foundation. Owner review reproduced empty-dataset success and invalid-split acceptance; scoped fixes add fail-closed validation, input/output isolation, honest synthetic fixtures, scoped setup and capability-versus-evidence documentation. Twelve scoped tests and CLI/report/hash-preservation checks pass. No real metrics/artifacts/device tests are inferred from that foundation. Original Anushka commits/attribution are preserved.

Additional A4–A6 work stays in Anushka’s two directories: manifest/reference/privacy/regression hardening; supplied-baseline-v1 evidence/model-bundle audit; exhibition readiness/gap and judge-claim packet. Issue #15 stays open and the current registered branch is reused. The owner explicitly authorized merging the submitted work; subsequent teammate edits still require confirmed claim. No main push, protection bypass or unrelated app changes are part of this documentation patch.

## Owner-requested Madhya Pradesh first-field case — 2026-10-09

My Farm now provides name → explicit map/manual/skip → actual lookup progress → mapped soil and weather cards → soybean/wheat/gram selection → atomic local save and initial preparation steps. Free locally bundled Leaflet and attributed OpenStreetMap tiles; fixed ISRIC WRB-class and Open-Meteo server lookups require explicit point-sharing consent. Mapped soil is separate background context, never a lab measurement or engine input. Coordinates remain transient unless separately opted into local retention; default backups omit them. Unknown farmer inputs remain unknown and existing management/backup controls are preserved. See ../farm-companion/FIELD_SETUP.md.

Validation: npm run check passed lint/typecheck/137 app tests/production/offline build. Browser public synthetic-point test showed actual tiles/pin/progress and Vertisols; direct weather failure led to a verified free same-provider server transport, after which both weather and soil cards rendered live source/time/interval-labelled context. Soybean save and no-location gram save survived reload without stored coordinates, preserving existing records. Cancellation and no-consent skip worked; 390px context/steps had no horizontal overflow. Physical-device/rehearsal/download QA remains pending. No farmer photos/precise locations, weights, training edits, agronomic thresholds or fabricated advice entered Git. Initial preparation prompts work; reviewed catalogs and evaluated target-grain screening remain pending. Keep #11 open.

## Consolidated owner merge — 2026-10-09

Owner requested merging all current work. Anushka #21 and registry #22 are already on main. Yashi’s #14 literature commit is preserved with attribution in owner integration because its historical branch fails scope CI. Review corrections distinguish current server-side screening from planned browser inference, correct Noyan’s initials/preprint strength, and separate the source’s 32% still-image F1 drop from 39% video. Source-access limitations and project evaluation gaps remain explicit; the research is not runtime agronomic advice. Aanya #23 duplicates the exact n0debug mapping already merged in #22; its original branch/commit can remain preserved when closing it as superseded. No failing scope check is bypassed, no main push or private artifact is part of integration.

## Late Task 12 documentation integration — 2026-10-09

Aanya’s PR #25 arrived during the owner-requested merge sweep. Its original commit and attribution are preserved in owner integration. Test/device/demo/fallback plans are useful partial delivery; unversioned desktop/VoiceOver/backup and one-rehearsal pass reports lacked a fixed SHA, versions and run evidence. Owner review labels these contributor-reported/unverified rather than release passes, distinguishes file upload from camera execution and schema-1 record metadata from schema-8 snapshots, and links actual owner software evidence separately. Physical devices and three verified rehearsals remain pending. No new device result is fabricated; #16 stays open and the registered Task 12 branch/scopes remain unchanged. Documentation links and diff checks pass; runtime files are unchanged from merged #24.
