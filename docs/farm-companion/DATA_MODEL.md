# Farm companion data model and local storage plan

Status: proposed entity contract, not executable schemas. Arindam owns runtime types, validators and migrations; Arindam also owns catalog schemas/content; Yashi supplies research and evaluated model artifacts. Do not extend the existing context v1 silently.

## Entity boundaries

All persisted entities carry schema_version, a generated stable ID, created_at/updated_at UTC timestamps and origin (user/demo/import). Local dates such as sowing date and soil sampling date use YYYY-MM-DD plus farm timezone; never shift them through UTC midnight. Amounts/counts are finite, explicit units; unknowns are null. Foreign references must resolve before import commits.

| Entity | Required domain fields and relationships |
| --- | --- |
| Farm | name, preferred_language, timezone, field IDs; no mandatory contact/identity |
| Field | farm_id, name, confirmed region or null, optional area `{value, unit}`; irrigation availability unknown/rainfed/irrigated/supplemental; optional confirmed coordinate record |
| Coordinate record | latitude/longitude/accuracy/method, consent timestamp, save_on_device choice; use transient coordinates by default |
| CropCycle | field_id, crop_id, variety_id nullable, status planned/active/harvested/archived, sowing_date nullable, stage nullable, stage_recorded_at, intended_season nullable; incompatible dates/stages require confirmation |
| SoilTest | field_id, sample_date, lab/source, depth, measured property readings with units; optional report reference; no report/photo storage by default |
| ContextSnapshot | context v1 reference, field/cycle IDs, source/fetch/observation times, expiry policy; persisted copy omits precise location unless opt-in |
| RecommendationRun | field/cycle IDs, input revisions, catalog/engine versions, rule decisions and time; no photo or precise coordinates |
| ActionFeedback | rule/action/cycle IDs, state done/snoozed/not_applicable/needs_help, optional note; no automatic efficacy inference |
| CalendarTask | cycle_id, reviewed template/action ID, due_date or date window, status, reason; retain completion when rescheduling |
| Observation | cycle_id, date, plain-text notes and tagged symptoms; optional scan_summary_id; images not saved by default |
| ScanSummary | cycle_id nullable, model_version, predicted_class nullable, confidence nullable, uncertainty state, timestamp, result availability; no retained photo by default |
| Expense | cycle_id, date, category, positive amount, currency, optional note; refunds represented explicitly, never guessed |
| Harvest | cycle_id, date, positive quantity, unit, optional harvested_area; multiple harvest events supported |
| Sale | cycle_id, date, positive quantity/unit, gross_amount/currency; harvested and sold quantities are separate |
| CatalogEntry/Evidence | version, applicability region/crop/stage/language, review status, source URLs and access dates, reviewer/date; Arindam owns content and review integration |

Initial economic reporting uses INR. Do not aggregate unlike currencies or quantities without a documented conversion; no exchange-rate API needed. Store currency minor units to avoid decimal rounding drift. Area conversion uses explicit constants and tests; missing area means no per-area yield. Soil analytes require test method/unit compatibility; total nitrogen is not interchangeable with plant-available nitrogen.

## Local persistence

IndexedDB is the source of truth for farmer records. localStorage holds only lightweight preferences. Use repository interfaces so components never access storage directly. Choose a small open-source helper only after owner review of maintenance/license/size, or use browser APIs; no dependency service or remote DB required. Browser storage is not a backup and can be cleared/evicted: expose export and a clear device-storage explanation.

Default: retain profile fields/region, cycles and records on device; precise coordinates remain in memory for fetching. Opt-in “Remember this field location on this device” saves coordinates locally and is independently revocable. Geolocation consent also explains coordinates are sent to the selected weather provider; never send the farm name, diary or photo. Export excludes precise coordinates by default, with an explicit opt-in inclusion choice. Account sync/remote persistence excluded from initial build.

## Import, export and deletion

- JSON envelope: schema_version, exported_at, application_version, data arrays and inclusion flags. CSV exports for expenses/harvests are optional views, not full backups.
- Import into a staging area; validate version, types, bounds, sizes, units, referential integrity and IDs; show a preview. Unknown future versions reject without writing.
- Reimport is idempotent for matching IDs/revisions. Conflicting revisions require explicit resolution; never silently overwrite. Commit all changes in one transaction; rollback on failure.
- Schema migrations are versioned, tested and transactional. Export before a destructive migration; failed migration leaves existing records readable.
- Allow deleting a record, cycle or all app data; preview dependent records. Revoke saved location separately. Cache/catalog refresh must not erase diaries.
- Shared exhibition devices use synthetic fixtures and a reset-demo action; don't collect visitor identities or real farm records by default.

## Validation scenarios

Persistence across reload, private/storage-blocked browsers, quota errors, absent/invalid dates, missing area, mixed units/currencies, multiple harvests, expense refunds, duplicate/conflicting import, missing references, failed migration rollback, escaped user notes, location revoke, coordinate-free export, field/cycle deletion, timezone date boundaries.
