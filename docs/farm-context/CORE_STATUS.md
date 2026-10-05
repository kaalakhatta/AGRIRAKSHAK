# Arindam: Task 10 core build status

Branch: codex/farm-task-10-arindam. Cumulative issue: #11. Current milestone: M1 + M2 infrastructure ready for review; agricultural catalog integration and on-device weather success remain pending.

## Completed

- M0: setup merged, real /claim confirmed by GitHub Actions and issue assigned to kaalakhatta. Main ruleset was subsequently disabled at the owner's explicit request; scope CI still runs, but branch protection is not enforced. Do not restore/change that setting without owner direction.
- M1: /farm screen with field/farm creation/editing, area/unit/region/water inputs; crop-cycle create/edit/status/date/stage inputs; multiple fields/cycles; local IndexedDB persistence.
- M1: GPS request/manual coordinates/skip, explicit field confirmation, transient-by-default coordinates, opt-in local retention and independent coordinate removal.
- M1: versioned and bounded validation, coordinate-free default backups, previewed imports, explicit conflict choices, idempotent import, transactional saves and stale-tab conflict prevention.
- M1: field/cycle/all-record deletion previews; field deletion cascades to its cycles; unknown future data/database versions reject without erasure.
- M1: responsive page and navigation from existing scanner, focused deletion/next-cycle affordances, twelve domain/storage tests wired into npm run check.

- M2: /today and embedded selected-field overview; separate weather-sharing consent/revocation; direct Open-Meteo weather adapter, unit/time/interval validation, bounded retries, rate-limit handling and transient cache.
- M2: declarative engine-1 handoff contract; full catalog validation, reviewed/evidence gates, applicability, required input provenance/unit/depth/interval/freshness, synthetic and cross-field blocking, conflict suppression. Runtime catalog is empty pending real reviewed content.
- M2: record-quality prompts, honest unavailable soil/sensor states and source attribution. No dependencies added.

## Evidence

See ../farm-companion/M1_VALIDATION.md. npm run check passes lint/typecheck/12 tests/production build. Browser tests used synthetic records only: save/reload, crop persistence, manual-confirmation block, session-only versus retained location, invalid import rejection, valid preview/merge/reload and conflict-choice gate. Screenshots captured outside Git; no farmer photos/locations or model artifacts were committed.

M2: npm run check passes lint/typecheck/23 tests/production build. Live provider smoke with synthetic 0,0 returned HTTP 200 and passed parsing; Origin header received access-control-allow-origin: *. In-app browser verified field/cycle selection, disabled fetch before consent, no-location fallback, fetch failure isolation, revoke/reset and reload privacy. Browser live fetch failed; success rendering and physical-mobile accessibility remain pending QA. See ../farm-companion/M2_CONTRACT.md.

## Remaining

- Human review/merge of M1 PR; independent GPS permission-denied/unavailable and physical-phone/accessibility/storage-failure QA.
- Validate actual exported-file delivery on exhibition browsers; export transformation is unit-tested and browser dispatch/status was observed, but the in-app download event could not be captured.
- M2: teammate catalog schema agreement and human-reviewed catalog integration; successful browser weather request/render on exhibition devices. Session cache is not offline installation. Engine uses exact normalized units; broader conversions/optional rules need reviewed contracts.
- M3: reviewed seed/crop identifiers and matching, calendars, scanner timeline/model integration. Existing main scanner remains a clearly labelled interface simulation; actual inference work on other branches is not silently replaced/integrated here.
- M4/M5: soil/expense/harvest records, season summaries, offline caching and exhibition release.
- Region/crops/reviewer/date/devices/language remain TBD. No seed advice, weather or yield gain is fabricated in M1.

## Handoff

Read full Task 10 brief and current PR before continuing. M2 owner handoff is ../farm-companion/M2_CONTRACT.md; current cumulative PR is #13. M1 runtime contract is apps/web/lib/domain/farm.ts, separately versioned from context v1. Cycles currently store farmer-entered crop/variety text; matching to reviewed catalog IDs is an M3 migration/integration step. Unknown future versions fail closed; no destructive migration exists in M1. Do not edit teammate-owned directories or untracked services artifacts. Never close cumulative #11 for this milestone.
