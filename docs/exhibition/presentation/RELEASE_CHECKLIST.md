# Release checklist

This packet contains draft plans and contributor-reported results. It does not approve release or certify completed M0–M5 QA. Owner software checks and device execution are separate evidence.

| Software area | Requirement / milestone | Existing owner evidence | Presenter-device gate |
| --- | --- | --- | --- |
| Profiles, cycles, backup | F01 / M1 | [M1 validation](../../farm-companion/M1_VALIDATION.md) | Pending exact-build persistence/export/recovery run |
| Weather and abstaining rule engine | F02–F03 / M2 | [M2 contract](../../farm-companion/M2_CONTRACT.md), [field setup](../../farm-companion/FIELD_SETUP.md) | Pending consent/provider failure checks |
| Personal calendar / timeline | F04 / M3 | [Calendar](../../farm-companion/M3_CALENDAR.md), [timeline](../../farm-companion/M3_TIMELINE.md) | Pending current-build device run |
| Reviewed seed/content and target-crop screening | F05–F06 / M3 | [Planning](../../farm-companion/M3_PLANNING.md), [M5 boundaries](../../farm-companion/M5_EXHIBITION.md) | Reviewed catalogs and target-grain model evidence remain absent |
| Soil/expenses/harvest/sales review | F07–F09 / M4 | [Season review](../../farm-companion/M4_SEASON_REVIEW.md) | Pending actual-device record/recovery checks |
| Offline/update and local scanner | M5 | [M5 exhibition](../../farm-companion/M5_EXHIBITION.md) | Pending installation/update, camera and backup delivery rehearsal |

The remaining full-roadmap F10–F13 gates must be traced to the [build plan](../../farm-companion/BUILD_PLAN.md); this table is not their completion certificate.

- [ ] Exact tested commit, farm snapshot/backup schema, device/browser versions and fixture IDs recorded.
- [ ] Actual presentation-device camera/upload, permission and failure journeys verified.
- [ ] Backup saved to disk, checked and restored into a separate disposable synthetic test environment.
- [ ] Offline installation/update and intended rollback to a compatible build rehearsed; no real-storage clearing.
- [ ] Supplied model/source/license/evaluation gaps reviewed with Anushka/Yashi; running model is not field accuracy.
- [ ] Three actual rehearsals evidenced; owner decides release readiness.

| Date | Reported build/device | Reported outcome | Evidence status / unresolved gaps |
| --- | --- | --- | --- |
| 2026-10-09 | “M5 / Mac Chrome”; exact SHA/device/version TBD | One pass reported | Unverified; duration, actions, result records and defects not supplied |
| TBD | Presentation device TBD | Not-run | Rehearsal 2 pending |
| TBD | Presentation device TBD | Not-run | Rehearsal 3 pending |
