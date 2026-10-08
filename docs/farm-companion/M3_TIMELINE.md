# M3 partial delivery: independent screening timeline

2026-10-06 · Task 10 · PR #13 · Refs #11.

The existing scanner remains an interface simulation. This change adds explicit local summary saving and `/records` filtering by cycle or unlinked records. It does not integrate an ONNX model, camera service, disease catalog or recommendation trigger.

The farmer must select a saved cycle or explicitly choose an unlinked demonstration, then click Save. Successful saving disables repeated saves for that displayed result; a fresh demo run is a separate event. Storage failure/stale revision is visible and cannot claim success. Scanner execution does not require location/weather/device storage. Removed/replaced images invalidate pending demo results; provider exceptions show unavailable and save nothing.

No photos, filenames, coordinates, simulated confidence or real predicted class enter the record. ScanSummary contains record metadata, nullable cycle_id, actual demo completion timestamp screened_at (distinct from save time), model_version, availability simulation/unavailable, optional demo_label, predicted_class null and confidence null. Demo summaries require origin demo and render an explicit no-model-prediction label. A future real model integration must supply a separately reviewed contract; the current summary factory rejects mode onnx. An unavailable record never has a demo label or prediction. The current UI does not manufacture unavailable events or pretend they were tested screenings.

## Schema 3 migration

FarmData/envelope schema 3 and application_version farm-m3-v3 add scans. Existing schemas 1 and 2 migrate in memory with scans empty and preserve their fields/cycles/reminders. Next successful revision-checked save atomically writes the full schema-3 snapshot; database store/version is unchanged. Old envelopes must match their record schema/version, and old schemas containing undeclared scan arrays reject rather than silently drop them. All existing backup coordinate privacy rules remain.

Summaries are bounded/validated, stripped of unsupported properties, globally unique by ID, and refer only to existing cycles or null. Import preview includes summary count; matching IDs are idempotent and changed IDs use explicit conflict resolution. Cycle/field deletion cascades linked summaries; unlinked summaries remain unless individually deleted or Delete all is confirmed. Records has its own explicit deletion preview. No permanent browser deletion was executed during testing. Export before downgrade: earlier app builds cannot read schema 3.

## Validation

npm run check passes lint/typecheck/35 tests/production build. Five focused scan tests cover privacy stripping and non-prediction semantics, invalid/forged modes and timestamp/origin checks, backup/idempotent/conflicting import and reference integrity, v1/v2 migration and deletion isolation. Existing storage rollback/stale-revision tests remain passing.

Browser test used a generated 32×32 green PNG, not a farmer photo. Save was disabled before an explicit cycle choice; a linked demo saved successfully; repeated save became disabled. Records showed the cycle/version/time and visible simulation/no-prediction label, and reload retained it. Image and screenshot fixtures are temporary files outside Git. Successful field model inference, camera permission flows, physical-mobile/accessibility QA and native backup-download delivery remain pending. This slice does not claim full M3 completion.

Remaining M3: reviewed seed/crop/catalog IDs and templates, recommendation feedback/snooze/deduplication, evaluated model integration and model uncertainty timeline contracts. Advice remains abstained without genuine reviewed content. No paid services or new dependencies were added.
