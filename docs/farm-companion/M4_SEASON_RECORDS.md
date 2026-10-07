# M4: expense and harvest records

Task 10, Arindam; branch `codex/farm-task-10-arindam`, PR #13, Refs #11. Records provides Expenses and Harvests alongside the soil notebook and screening timeline. This slice implements the two diaries and focused summaries; sales, observations and fuller season review remain pending.

## Expense v1

Each record has standard metadata, cycle ID, local date, category, kind cost/refund, a positive safe-integer `amount_minor`, currency INR and optional bounded plain-text note. Rupee input is parsed as decimal text into paise, never through floating-point rounding. More than two decimal places, exponent notation, negative/zero amounts and unsafe integers reject. Refunds are explicit positive records; a refund exceeding recorded costs shows negative recorded outlay, without assuming whether a cost was omitted.

Totals use BigInt arithmetic, including aggregates exceeding Number safe-integer limits. Each stored amount is a normal JSON-safe integer; BigInt totals are derived only and formatted directly. Categories show net costs/refunds for the selected cycle. Demo totals are separate from real totals. Missing records do not certify zero costs. The UI warns that records may be incomplete and does not call outlay profit. No sale value, exchange rate, projected price or unpaid cost is inferred. INR-only validation rejects other currencies rather than aggregating them.

## Harvest v1

Each picking has standard metadata, cycle ID, local date, positive finite quantity, unit g/kg/t/piece, optional positive harvested area ha/acre/m2 and optional plain-text note. Pieces must be safe whole integers. Supported conversions: g ×0.001 to kg; tonne ×1000 to kg; hectare =10,000 m2; international acre =4046.8564224 m2. There is no basket/bag conversion. Original quantities/units are retained; only weight summaries normalize. Floating-point conversions are approximate and displayed up to six fractional digits (very small values use scientific notation); item totals use exact integer arithmetic.

Weights and counts are separate totals. No weight entries means missing, not zero kg. Invalid or unrepresentable conversions reject; an overflowing aggregate/rate displays unavailable. Optional per-picking kg/ha requires both mass and explicitly entered harvested area. Missing area never falls back to field area. Piece counts do not produce kg/ha. Repeated pickings may cover the same land, so areas are not added into a season denominator and no full-season yield is calculated. No causal yield improvement is attributed to recommendations. Harvested quantity is not sold quantity.

Expense/harvest dates use the farm timezone and cannot be future or after entry creation. Costs before sowing are allowed. Harvests require active/harvested/archived cycles and cannot precede known sowing dates. Saving does not automatically change cycle status. A later cycle edit incompatible with existing harvests also rejects atomically.

## Persistence and privacy

FarmData/backup schema 5 (`farm-m4-v5`) adds required expenses/harvests arrays. Matching legacy envelopes v1–v4 migrate with empty diaries without losing older records. Old schemas carrying hidden new arrays reject; unknown future versions reject. Snapshot/store structure is unchanged: normalization is in memory and the next successful revision-checked transaction writes v5. Reimport is idempotent; changed IDs preview conflicts and need an explicit choice. No destructive reset or silent overwrite.

Both diaries use separate Records views that reload the current snapshot when selected. Create/edit and focused delete preview are available; field/cycle deletion cascades linked season entries, while cycle deletion keeps field soil history. Import and deletion previews include the new record types. Default backup excludes precise field coordinates; record validators strip unapproved photo/location/executable properties. Notes render as React text and are never executed. Demo field/cycle forms force synthetic labels and existing synthetic records cannot lose their label when edited. Export before downgrading: earlier builds reject schema 5 and cannot read/edit the new snapshot.

No new dependencies, paid APIs, accounts or currency services are needed. Browser storage may be cleared and is not a backup. BigInt support in the exhibition browser remains part of physical-device QA; successful in-app browser checks are not a claim that every phone is verified.

## Validation

`npm run check`: lint, TypeScript, 57 tests and production build pass. Ten added season tests cover exact decimal parsing and large paise sums, refunds/cycle isolation, invalid currencies/units/dates/metadata, stripped private fields, mixed-unit mass normalization and separate pieces, explicit area conversions/missing denominators/overflow, planting constraints/timezones, legacy v1–v4 backup migration, conflict/idempotent imports, deletion cascade and IndexedDB v4 migration/persistence/stale-write preservation. Acre conversions are asserted with floating-point tolerance; INR totals remain exact.

Browser checks used synthetic exhibition records only. Saved ₹125.50, a ₹25.25 refund, rejected a three-decimal refund edit, then saved ₹25.30 and verified ₹100.20 outlay. Created a synthetic test crop under a demo field and entered 100 kg with 1,000 m2 area, 500 g with unknown area, and three pieces. Totals were 100.5 kg plus three pieces; editing to four pieces kept weight unchanged. Verified unknown per-area values, known per-picking 1,000 kg/ha, reload persistence for both diaries and deletion-preview cancellation. Screenshots are outside Git. No permanent browser deletion executed; cascade paths are unit-tested. Actual exported-file delivery, independent Task 6/physical-device accessibility and storage failure QA remain pending.
