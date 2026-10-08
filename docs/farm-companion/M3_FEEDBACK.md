# M3: preparation feedback and saved follow-ups

Task 10 · Arindam · Refs #11 · codex/farm-task-10-arindam · cumulative PR #13. Agricultural recommendations remain gated on reviewed evidence; this delivery tracks existing preparation prompts.

## Farmer flow

Today → select field/crop cycle → Update feedback on a next-step card → choose response, optional note and a date for snoozing → save locally. Available states are To review, Done (self-reported), Snoozed, Not applicable and Need help. Done on a due personal reminder is labelled Reminder reviewed; actual reminder completion/rescheduling stays in Plan.

Done/not-applicable/snoozed responses leave the active list. Needs-help stays visible. Show handled steps restores all current cards. Saved follow-ups shows current and prior input contexts, status/date/note, with change/reopen controls for responses matching current suggestions. Reopening preserves the note and resets the response to pending. Need help contacts nobody; snoozes send no notifications. Responses are included in farm backups.

## Context and advice boundaries

ActionFeedback v1 stores metadata, field_id, nullable cycle_id, allowlisted preparation step ID, generator_version preparation-1, exact input_key, card title, state, nullable snooze_until and optional note. Notes are bounded to 500 characters and titles to 180. HTML-like text renders literally. Arbitrary agricultural rule IDs/versions cannot be imported as preparation feedback.

The input key includes generator version, synthetic mode, field/cycle IDs and source update times, card title/explanation/input descriptions/timing, a relevant personal reminder revision/schedule and latest non-demo soil revision. Coordinates and photos are never copied from fields into keys. Input keys validate canonical JSON shape/scope/timestamps and allowlisted schedule fields; unknown private structured payloads reject. Card data is inert text, never executable content.

Changing relevant source revisions or displayed card inputs creates a fresh context. Old responses remain in history and do not hide the new suggestion. Identical inputs update the existing response ID, avoiding duplicate rows. Imported duplicate logical contexts with different IDs reject rather than silently choosing a winner. A changed-input form cannot save until the user reviews the current explanation and chooses Use current inputs; its draft note is retained.

Due-today → overdue display changes are presentation only for the same personal reminder schedule. Its fingerprint retains the scheduled date, so a snooze lasts to the chosen local date. Actual schedule/revision or confirmed stage/cycle changes trigger a new review. Snoozes must be later than their recorded local day; expired records remain valid/readable and become active on the selected day without a write or notification.

Real/demo mode is part of the key. Synthetic farm/field/cycle/task provenance marks new responses demo. Prior real contexts imported under a newly synthetic parent stay history and cannot suppress demo-mode suggestions. Feedback never fills missing region/season/soil/location values, completes Plan tasks, establishes efficacy or bypasses catalog/evidence/freshness gates. No agricultural dosage, crop diagnosis or yield gain is inferred.

## Persistence and migration

FarmData/backups use schema 8, application_version farm-m3-v8, with required feedback. Matching v1–v7 snapshots/backups normalize with empty feedback while preserving earlier records. Old versions carrying hidden feedback, future versions, invalid scope/references, duplicate IDs/contexts and malformed snoozes reject without saving. Maximum 1,000 feedback contexts and the existing 2 MB backup limit apply. IndexedDB layout is unchanged: load normalizes in memory and revision-checked writes commit atomically. Import previews include feedback and explicit conflict decisions. Cycle deletion removes its responses and keeps field-only responses; field deletion removes all its feedback. Default exports omit precise coordinates. Older builds reject schema 8; retain a backup before downgrading.

## Verification

npm run check passed lint/typecheck/87 tests/production build; git diff --check passed. Ten new tests cover validation/key scope/status/snooze rules; idempotent stable-ID updates/immutability; active/hidden/expired states/local-day boundaries; changed-source invalidation and stale-form rejection; field/cycle/no-cycle/demo isolation; due-to-overdue snooze stability and schedule changes without Plan completion; privacy/unsupported key rejection; all legacy migrations/duplicate/version guards; backup/import conflicts/cascades; and atomic IndexedDB migration/persistence/stale/invalid writes with missing inputs still unknown.

Browser QA used synthetic field/cycle records. Saved done on seed preparation (four active steps became three), reopened it (four again, one response), edited to needs-help with a literal HTML-looking note, then snoozed water preparation to 2026-10-09. Handled display showed its saved date. A second cycle retained its independent steps and zero responses. Reload preserved two responses, the needs-help badge, snooze date and notes, all labelled synthetic. No weather consent, help message or permanent deletion performed. Screenshot is outside Git. Source-change/expiry/stale-write cases use deterministic fixtures; no real calendar boundary was waited out.

Physical-device accessibility/responsiveness, exported-file delivery and independent Task 6 QA remain pending. No dependencies, paid service, notifications, model or reviewed advice were added. Reviewed agricultural-action feedback integration remains a later contract once catalogs are available.
