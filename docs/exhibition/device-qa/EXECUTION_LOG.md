# Execution log

## Submission and evidence status

Aanya’s original PR #25 / commit `80c52cd5b78db7f1b97f330086d594002ecee54e` reports desktop execution on October 9, 2026. It identifies the tested build only as moving `origin/main`, with no resolved SHA, OS/browser versions, run artifacts or fixture IDs. Owner integration preserves these reports but cannot verify them as passes. This review did not execute Chrome/Safari/VoiceOver or a physical-device rehearsal.

The submission says “schema v1” without naming a contract. Current farm snapshot/backup schema is 8; individual record metadata schema remains 1. Record the actual tested contract/version rather than treating these as interchangeable. Fixtures are reported as synthetic Sehore exhibition samples; exact IDs remain TBD.

## Reported checks; evidence pending

| Journey | Contributor report | Owner evidence status / next check |
| --- | --- | --- |
| Today, Plan, Records, My Farm on desktop | Pass reported | Unverified; exact build/versions, cases and results required |
| Scan file upload | Pass reported | Unverified; consent, fixture kind and endpoint result required |
| Keyboard focus / VoiceOver | Pass reported | Unverified; separate keyboard and screen-reader run records required |
| Location denial / skip | Pass reported | Unverified; capture permission outcome and manual/revoke cases separately |
| Camera | File-upload fallback reported | Camera permission/capture not established by upload |
| Missing weather / unavailable model | Pass reported | Unverified; failure setup and observed UI required |
| Offline HTML/JS cache | Pass reported | Unverified; record installation/update and server/network-off reload cases |
| Backup import / conflicts / desktop download | Pass reported | Unverified; verify actual saved-file delivery and recovery on disposable synthetic records |
| Synthetic-only records | Reported | No real farmer data or private artifacts included in the submitted diff |

Actual physical mobile, storage failure, deletion confirmation, invalid/large/empty uploads and three verified rehearsals remain not-run or evidence-pending. Do not mark them passed from software CI. Owner software/browser evidence from other runs is separately recorded in [M5 exhibition](../../farm-companion/M5_EXHIBITION.md) and [field setup](../../farm-companion/FIELD_SETUP.md); it does not verify this contributor’s claimed device runs.
