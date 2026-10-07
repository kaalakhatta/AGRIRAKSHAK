# M4 partial: measured soil notebook

Task 10, Arindam. Cumulative branch `codex/farm-task-10-arindam`, PR #13, Refs #11. This slice implements manual soil records; it does not complete M4 or authorize agricultural recommendations.

## Runtime and provenance

`apps/web/lib/domain/soil.ts` validates SoilTest v1. A field reference, sample date and source name are required. Source kind distinguishes soil laboratory reports (`soil_lab`) from manual/test-kit results (`manual_test`); both are manually entered and self-reported, never independently verified by this app. Source names are plain text. Synthetic records carry origin `demo`; demo field forms always mark entries synthetic and editing cannot remove an existing synthetic label.

Supported properties are soil pH (`pH`, 0–14), organic carbon (`g_kg`, 0–1000), sand and clay (`percent`, 0–100). These input bounds and sand+clay <=100 validate the representation, not crop suitability or recommended agronomic ranges. At least one property is required, each only once. Unknown values are omitted, never zero-filled. Zero is retained. Other nutrients, units and conversions are unsupported; keep original reports outside the app rather than guessing. Organic carbon is not organic matter. Per-property method is optional/null; unsupported methods cannot implicitly establish comparability.

Depth is an optional/null top/bottom interval in cm. Both limits must be supplied together, finite, nonnegative and increasing. Sample dates are local dates in the field's farm timezone; future dates and dates after creation of the entry reject. Editing preserves original creation metadata and sample age. Unknown depth/method remains explicit. Precise sampling timestamps are unavailable, so these local dates are not converted into a fabricated engine observation timestamp.

The UI in Records supports field selection, create/edit, sorted history and focused deletion preview. Unknown details remain visible. Soil and screening views mount independently and reload the current store; stale-tab revisions are still rejected. Soil history belongs to a field, not a crop cycle. Field deletion removes its soil tests; cycle deletion preserves them; Delete all removes everything with preview. No files/photos/reports/location metadata are retained by SoilTest validation.

## Migration, backup and rollback

FarmData and JSON backup schema 4 (`farm-m4-v4`) add `soil_tests`. Record schema remains 1. Old schema-1/2/3 snapshots and matching backup envelopes normalize in memory to schema 4 with empty soil tests and preserve existing fields/cycles/tasks/scans. Earlier schemas carrying soil arrays reject rather than silently drop them. Schema 4 requires its array; future versions fail closed.

The IndexedDB database/store structure is unchanged. Next successful save writes schema 4 atomically with a revision check. Import validates references/IDs, previews additions/conflicts and keeps unrelated data; reimport is idempotent. Default export still excludes precise field coordinates. Before downgrading export a backup: older app builds reject schema 4 and cannot edit the new snapshot. Do not reset storage or force a downgrade migration.

## Recommendation integration and limits

Today distinguishes no non-demo field soil records from a recorded sample, links to the notebook and explains missing depth/method metadata. It retains the actual sample date and does not certify freshness or prescribe soil treatments. Synthetic or other-field soil entries cannot satisfy measured-data prompts. Runtime agricultural catalog remains empty. Connecting readings to engine inputs requires reviewed method compatibility, depth, source and freshness rules; manual tests must not be relabelled as lab results. No maps, telemetry, AI calls, training models or dependencies added.

## Validation evidence

`npm run check`: lint, TypeScript, 47 domain/storage/provider/engine tests and production build pass. Eight added tests cover malformed sources/metrics/units/depth, scalar versus array property IDs, unknown/zero preservation, privacy stripping, date/timezone/reference validation, migration v1–v3, future/version rejection, idempotent/conflicting backup imports, field/cycle deletion, persistent IndexedDB migration with atomic stale-write rejection and demo/foreign-field exclusion from preparation prompts. Existing legacy tests now assert schema 4.

Browser checks used only synthetic exhibition records: saved pH 6.2 and organic carbon 0, retained unknown depth/method, rejected a one-sided depth edit without replacing saved data, edited to 0–15 cm with a labelled synthetic method, reloaded and verified values, opened/cancelled deletion preview, and verified existing scan timeline survived. Screenshot is outside Git. Actual browser deletion and exported-file delivery were not executed/confirmed. Physical-device accessibility, storage failures and independent Task 6 QA remain pending. Observations, expenses, harvest/sales and season review remain subsequent M4 work.
