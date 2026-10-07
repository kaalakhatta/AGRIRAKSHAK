# M4: dated crop observations

Task 10 · Arindam · Refs #11 · codex/farm-task-10-arindam · cumulative PR #13. Runtime record modules are present; physical-device QA and exported-file delivery remain open.

## Farmer flow

Records → Observations → choose the field/crop cycle → enter observation date and a plain-text note → optionally select descriptive tags and a screening reference → save locally. Edit restores the saved date/note/tags/reference. History shows newest observation date first, with optional tag filtering. Deletion requires a preview. Backups remain in My Farm.

Notes are self-reported observations, not a diagnosis or automatic treatment trigger. No note means unknown conditions, not evidence of a healthy crop. Tags describe visible changes without estimating severity, agronomic thresholds or disease probability. Users are asked to keep precise location and personal details out of notes; no photo upload exists. HTML-like input stays escaped text.

## Contract and relationships

Observation v1 contains metadata, cycle_id, local date, required note (1–1,000 characters), distinct optional tags and nullable scan_summary_id. Supported tags: Leaf colour change, Spots or marks, Wilting, Insects seen, Growth change, Other. Tags may be empty; whitespace-only notes reject. Unsupported extra fields are stripped.

Cycle references must resolve. Local date cannot be future or after the entry creation day in the farm timezone. Preplant observations are allowed; there is no sowing-date constraint because a farmer may record a field visit before planting. Notes do not advance a growth stage.

A screening reference must resolve to a summary explicitly saved against that same cycle. Unlinked and foreign-cycle summaries cannot be linked. The reference retains the screening's own timestamp/version/availability; no temporal cause or diagnosis is inferred. Current summaries are demonstrations or model-unavailable records. A linked demo, demo origin or synthetic farm/field/cycle parent makes the observation synthetic. UI forces demo origin for such saves, while history/review also classify imported records by effective provenance. Existing demo origin cannot be removed by editing.

Deleting a screening clears its observation references atomically, keeps note/date/tags and preserves synthetic provenance. Its references are not replaced by a guessed screening. Cycle/field deletion removes corresponding observations; deleting one observation leaves screenings and other record types. Season review adds real/demo observation counts and latest local dates without inferring health, money, yield or causality.

## Storage and migration

FarmData/backups use schema 7, application_version farm-m4-v7, with a required observations array. Maximum 1,000 entries and existing 2 MB backup limit apply. Matching v1–v6 files normalize with empty observations and preserve prior diaries. Earlier schemas with hidden observations, absent current arrays, unknown versions, duplicate IDs and invalid references reject without saving. IndexedDB store layout is unchanged: normalization is in memory and the next successful revision-checked transaction persists v7. Imports include observations in counts, idempotent repeats and explicit conflict decisions. Precise coordinates remain omitted from backup by default. Older app builds reject v7; retain a backup before downgrading.

## Verification

npm run check passed lint/typecheck/77 tests/production build; git diff --check passed. Ten added tests cover note/tag limits and private-field stripping, timezone dates/preplant notes, screening reference integrity, demo inheritance, immutable chronology/cycle isolation, screening deletion/detach/provenance, v1–v6 migrations, hidden arrays/future versions/limits, privacy/import conflicts/cascades, atomic IndexedDB migration/persistence/stale writes, and observation review counts with no financial or crop-health inference.

Local browser QA used synthetic exhibition notes on the imported synthetic cycle. Saved an Oct 6 note with Spots or marks and a same-cycle interface-demo reference; edited its text and added Leaf colour change. Whitespace-only edit rejected without replacing saved content. HTML-looking text remained literal. Added an Oct 7 Insects seen note, verified newest-first order, filtered to Spots or marks, opened/cancelled deletion preview and reloaded. Both notes, edited tags/text and the screening link persisted. Review showed two synthetic observations/latest Oct 7 alongside preserved prior costs/refunds; absent sales remained unknown. Screenshot is outside Git.

No permanent browser deletion was executed. Screening detach/cascade and stale writes were verified in unit tests. Actual exported-file delivery, physical-device accessibility/responsiveness and independent Task 6 QA remain pending. No dependencies, paid services, photos, field coordinates or reviewed advice were added.

Follow-up: current schema 8 includes preparation feedback. Legacy v1–v7 files remain importable; see [M3_FEEDBACK.md](M3_FEEDBACK.md). Checks above document the original observation delivery.
