# M3 partial delivery: personal season reminders

2026-10-06 · Task 10 · branch codex/farm-task-10-arindam · PR #13 · Refs #11.

## What works

`/plan` selects a field/cycle and offers farmer-authored reminders. A task is explicitly a personal plan, never reviewed advice. Choose a fixed local date, a signed whole-day offset from a known/unknown sowing date, or a stage the farmer confirms. No stage or agricultural timing is inferred. Unknown sowing stays unscheduled. Stage reminders have no invented calendar date and are ready only when the recorded stage matches. Dates use the stored farm timezone and YYYY-MM-DD arithmetic, independent of UTC midnight or daylight-saving changes.

Create/edit, mark done/reopen and previewed deletion run through the existing revision-safe IndexedDB snapshot. Today shows pending due/overdue/stage-ready reminders for its selected cycle. My Farm exposes each cycle's reminder list. No notification service or dependency was added.

Cycle sowing/stage edits with reminders show a confirmation panel. Pending sowing reminders preview old/new dates; choose Shift or Keep and explicitly confirm cycle details. Completed reminders do not move. Keep preserves original anchors, including an intentionally unknown anchor. Clearing sowing can unschedule pending reminders only after the same confirmation. User-requested edits of an individual completed reminder can change its text/schedule; its completion remains recorded until reopened.

Current runtime update: M3_TIMELINE.md adds schema 3 while preserving these schema-2 reminder records and accepting old backups. The schema-2 description below documents the calendar slice.

## Version and migration

FarmData schema 2 adds `tasks: CalendarTask[]`. Individual farms/fields/cycles/reminders retain metadata version 1. Reminder fields: cycle_id, title, schedule, status pending/done and completed_at. Schedule is exactly date/date, sowing/offset_days/anchor_date, or stage/stage. Runtime validator strips unsupported extra fields, rejects invalid dates/schedules/completion timestamps/IDs/references and bounds record arrays. Tasks contain no executable catalog rules.

Old schema-1 data migrates in memory to schema 2 with an empty task list; the next successful revision-checked save commits the complete validated snapshot in the existing database/store. Database version remains 1 because there is no store/index change or destructive upgrade. Opening old data does not write or erase it. Schema-1 data claiming tasks is rejected to avoid silent loss. Unsupported future versions remain rejected; old app builds reject new schema-2 snapshots, so export before downgrading.

New backups use envelope schema 2 / application_version farm-m3-v2 and include reminders. Valid farm-m1-v1 backups remain importable through the explicit migration. Envelope/data versions must agree. Imports preview reminder counts, merge reminder IDs idempotently and use existing explicit conflict choices. Importing a different cycle date retains reminder anchors unless those reminder records are also explicitly replaced; inspect reminders after import. Coordinate exclusion remains default. Deleting cycles/fields cascades reminders in the same snapshot transaction; Delete all removes reminders too.

## Validation observed

`npm run check`: lint, typecheck, 30 tests and production build pass. Seven calendar tests cover leap/DST/timezone boundaries, unknown sowing/stage, reschedule isolation and completed history, invalid schedules/references/IDs, schema-1 backup migration/schema-2 round-trip/privacy, import conflicts/cascades and revision-safe legacy IndexedDB upgrades. Existing quota rollback and stale-write tests still pass.

Browser used synthetic records only. Existing two fields/cycles loaded after the data migration. Created two offset reminders with unknown sowing and observed unscheduled state; marked one complete; navigation/reload retained both. Edited synthetic sowing date to 2026-10-10: preview showed pending task unscheduled → 2026-10-11, Confirm disabled until date choice and confirmation, then pending task moved and completed task stayed unchanged. No real farmer location, photo or data was collected; no permanent browser deletion was executed.

## Remaining M3 and release gaps

Seed comparisons, stable catalog crop/region IDs, reviewed crop-calendar templates, recommendation feedback/snooze/deduplication and independent scan timeline/model integration remain pending. The current scanner remains a labelled simulation. Teammate catalog/reviewer/coverage are absent; no agronomic schedule or seed suitability is fabricated. Real-device mobile/accessibility/import/download/weather-success QA and offline installation remain pending. This is partial M3, not completion of Task 10.
