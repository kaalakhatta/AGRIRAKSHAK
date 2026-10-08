# M1 validation: local farm foundation

Build tested 2026-10-05 on the Arindam core branch. This report records implementation evidence, not agronomic efficacy or physical-device certification.

## Runtime and contract

Route: /farm. Types/validators: apps/web/lib/domain/farm.ts. Persistence: apps/web/lib/storage/farm-store.ts. UI: apps/web/features/farm/farm-workspace.tsx. First storage schema version is 1; no previous farm schema is migrated destructively. Unsupported future versions reject without modifying storage.

FarmData uses arrays of farms, fields and crop cycles with stable IDs, origin, UTC creation/update times and local sowing dates. UI accepts free-text crop/variety/region until reviewed catalogs provide identifiers; it offers no crop/seed suitability recommendations. Context v1 remains unchanged and separate.

## Automated checks

`npm run check` passes ESLint, TypeScript, `npm run test` (12 passing tests) and Next.js production build. Tests use Node 24's type stripping and Apache-2.0 fake-indexeddb (dev-only; no runtime data service). Unit scenarios:

1. Default backup excludes coordinates without mutating device data; explicit inclusion is supported.
2. Unknown versions, undeclared coordinates, broken references, duplicate IDs, malformed/oversized backups reject.
3. Invalid dates, nonfinite/out-of-bounds coordinates, invalid area and inconsistent stage records reject.
4. Duplicate imports are idempotent; changed records expose explicit device/backup choices.
5. Unrelated imports are preserved; field deletion removes only its dependent crop cycles.
6. IndexedDB persistence and stale-revision rejection preserve existing records.
7. Concurrent writers cannot silently overwrite each other.
8. Unavailable storage does not silently fall back to ephemeral data while claiming a save.
9. Failed writes abort and preserve the prior snapshot.
10. Future database versions are rejected without erasing their records.
11. Future planting dates cannot masquerade as already-growing crops, including through import.
12. Local date computation respects timezone boundaries.

`git diff --check` passes. Tests are part of the existing npm run check CI path; no paid runner/service added.

## Observed browser cases

Local production preview in Codex in-app browser, with synthetic field/crop names and 0/0 demonstration coordinates only:

| Case | Observed result |
| --- | --- |
| Save field with optional area/region/location skipped | Field created and persisted after reload |
| Save crop cycle with unknown date/stage | Crop cycle persisted; accessible by field selector after reload |
| Manual coordinates without confirmation | Save blocked with confirmation/skip message |
| Confirmed coordinates without retention opt-in | Session-only label; reload removes coordinates |
| Explicit remember-location opt-in | Saved-location label persists after reload |
| Invalid backup version | Error; existing field/cycle counts unchanged |
| Valid synthetic backup | Preview before save; confirmed import preserves existing records; merged counts persist after reload |
| Reimport changed records | Conflicts listed; Confirm import disabled until explicit resolution |
| Export backup button | Coordinate-free export status observed; actual download event not available to automation |
| 390 px mobile viewport | Single-column forms and readable content; no visible horizontal overflow in inspected view |

Desktop/mobile screenshots are local chat artifacts outside Git. No real location, visitor identity, private photograph or trained model was used or committed.

## Pending independent QA

Real Android/iOS GPS permission denial/revocation/timeout; keyboard/screen-reader validation; actual backup file download/import on exhibition browsers; physical devices and storage eviction/private mode; synthetic UI deletion after agreed disposable-fixture setup. Transaction/deletion behavior has unit evidence, but do not mark unexecuted device cases passed. Service-worker/offline app loading, live weather, recommendations and actual model inference are later milestones.
