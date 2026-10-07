# M4: sales diary and season review

Task 10 · Arindam · Refs #11 · branch codex/farm-task-10-arindam · cumulative PR #13. Partial M4 delivery; observation entries and device QA remain unfinished.

## Farmer flow

Records → Sales → choose a crop cycle → enter sale date, sold quantity/unit, gross INR money actually received and optional note → save locally. Edit corrects the same record. For later payments against that sale, edit its received amount rather than counting sold quantity again. Unpaid invoices, deposits, buyer identities, payment processing and sale returns are outside this cash diary. Deletion requires a preview; export backups in My Farm.

Records → Season review → choose a crop cycle. The view loads the current snapshot when opened. Reopen it after edits in another diary/tab. Display cycle status, known sowing date and season, then real totals with labelled synthetic totals in a separate panel.

## Calculation boundaries

- INR input permits at most two decimal places and stores positive safe integer paise. Received totals and cost/refund arithmetic use BigInt, including totals above Number.MAX_SAFE_INTEGER. No exchange or market-price API.
- Recorded balance is received money minus costs plus explicit expense refunds. Show it only when at least one cost and one sale exist. Missing sales are unknown, not zero; refunds alone do not imply known costs. Zero and negative computed balances remain valid.
- Label all figures as record-based: never profit, stock value, yield forecast or app-attributed improvement. Own labour, unpaid bills, losses, opening inventory and omitted entries are unknown.
- Harvested and sold weight normalize g/kg/tonnes to kg; whole piece counts are exact and separate. Compute differences only when both sides contain the matching quantity type. Missing types/overflow stay unavailable. Binary floating-point cancellation noise within eight scaled Number.EPSILON units is treated as zero; this is numeric tolerance, not an agronomic threshold.
- Differences compare diaries, not available stock. Missing pickings, household use and spoilage are not inferred. Sales may exceed an incomplete harvest diary; flag the mismatch for correction without blocking valid entries.
- Missing harvested area produces a gap notice. Per-picking kg/ha remains in Harvests. Repeated picking areas are not added into a whole-season denominator and field area is never substituted.
- Entries under a demo farm, field or cycle remain synthetic even if an imported child has another origin. Synthetic and real totals never mix; unrelated cycles do not contribute.

## Runtime and migration

Sale v1: metadata, cycle_id, local date, positive quantity/unit, gross_amount_minor, currency INR and nullable bounded plain-text note. Unsupported extra fields are stripped; no photo, buyer details or coordinates are retained with sales. Dates cannot be future or after entry creation in the farm timezone. A planted cycle is required and known sowing cannot follow the sale. Later incompatible cycle edits reject atomically.

FarmData/backups use schema 6, application_version farm-m4-v6, with required sales. Matching v1–v5 envelopes migrate with empty sales and retain older records. Old schemas carrying a sales array, unknown versions, version mismatch, invalid references and duplicate IDs reject without saving. Maximum 1,000 sale entries and existing 2 MB backup limit apply. Load normalizes in memory; the next successful revision-checked write commits v6 atomically. Imports include sales in previews/conflict decisions, reimport is idempotent, and cycle/field removal cascades their sales. Default backups omit precise field coordinates. Earlier builds reject v6; preserve a backup before downgrading.

## Verified checks

npm run check: lint, typecheck, 67 tests and production build passed. Ten season-review tests verify cash/quantity validation, stripped private content, dates/planting, partial harvest entry acceptance, exact/large/negative/zero money arithmetic, missing and refund-only costs, dimension separation, floating-point comparison, aggregate overflow, demo/cycle isolation, legacy v5 migration, hidden arrays/version rejection, backup/import conflicts/cascades and IndexedDB migration/persistence/stale writes. Earlier migration tests now assert current schema 6.

Local browser QA used synthetic entries only. Sale 60 kg at ₹1,500.10 edited to ₹1,500.35; an edit to ₹1,500.105 rejected and preserved saved values. Added two sold pieces at ₹50.10. Review first showed an unavailable balance with no costs. Then same-cycle cost ₹200.50 and refund ₹25.30 produced receipts ₹1,550.45, net outlay ₹175.20 and recorded balance ₹1,375.25. Harvested totals 100.5 kg and four pieces compared with sold 60 kg and two pieces: differences 40.5 kg and two pieces. Values survived reload. Sale deletion preview was opened and cancelled. No permanent deletion or real financial transaction executed. Screenshot stored outside Git.

Physical-device accessibility/responsiveness, full Task 6 QA, browser storage failures and actual exported-file delivery remain pending. No dependencies, paid services or reviewed agricultural content were added.
