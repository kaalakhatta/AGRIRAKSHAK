# October 9 exhibition runbook

Presentation: October 9, 2026, approximately 14:00 IST. Owner asks to finish tonight or early morning; freeze the candidate by 08:00 IST and rehearse before travelling. This build is an educational farm companion with Plan → Monitor → Improve, not disease-only diagnosis or professional farming advice.

## Start on this laptop

The project-local .venv and production build were prepared during the owner integration. Keep this checkout, node_modules, .venv, compiled .next/public offline files and the supplied private model directory on the presentation laptop. Do not copy model artifacts into Git. Start from repository root:

```bash
npm run exhibition
```

Open http://127.0.0.1:3000. Keep the terminal running. The command starts the web app and Python API on this laptop only; the API loads services/api/model. Use an alternative pair of ports if busy:

```bash
EXHIBITION_PORT=3013 EXHIBITION_API_PORT=8003 npm run exhibition
```

AGRIRAKSHAK_PYTHON can point to an existing compatible Python environment. To prepare another laptop ahead of time, install Node.js 24+, npm and Python 3.12, then:

```bash
npm ci
python3.12 -m venv .venv
.venv/bin/python -m pip install -c services/api/constraints-exhibition.txt -e 'services/api[dev]'
npm run check
npm run exhibition
```

Windows uses .venv/Scripts/python.exe. Only copy an approved private model bundle with its license/review evidence outside Git; absence leaves model screening unavailable. Keep the current working baseline until a replacement has real evaluation and a verified artifact contract. Internet is required for first dependency setup, not local records or local inference after setup. No paid API/subscription/card-required service is part of this launcher. An existing hosted website is a separate deployment; a Git merge does not prove its model endpoint is configured.

## Prepare before the presentation

1. Open Home. Click Add labelled sample farm once. This adds a fictional Sehore plot and soybean/wheat/gram cycles, personal reminder, observation and sample costs/harvest/sales without replacing existing records.
2. Expand Offline & app updates and choose Prepare offline app. Wait for Offline app ready. This caches six screens and compiled assets, not photos, API payloads, forecasts or farmer records. It is not a farm backup.
3. My Farm → Export backup → Download prepared farm backup. Save the JSON on the actual presentation browser/device, then use Check backup file. Valid, compatible backup file confirms its types/references/privacy flags; it does not certify completeness. Default exports omit precise coordinates.
4. Keep a second copy of the backup and this runbook. Browser-storage clearing can erase both cached files and diaries. Do not clear storage or update browsers immediately before presenting.
5. With one app tab open, check/apply any app update only after saving edits and exporting a backup. A waiting update does not silently reload open tabs. Freeze changes after the final rehearsal.
6. Rehearse on the actual laptop/browser and any phone. Verify camera permission or use Upload from files. Synthetic test checks and desktop viewport checks do not establish physical-device camera behavior.

## Five-minute demonstration

- 0:00–0:45, Home: introduce the Sehore farm companion and selected soybean/wheat/gram scope. Identify the fictional sample and local storage.
- 0:45–1:45, Plan: choose Sehore sample plot · demo and a crop cycle. Show farmer-authored reminders and a date/confirmed-stage option. Explain that reviewed seed/crop guidance stays unavailable until applicable sources and a genuine agronomy review exist; synthetic records are not real field evidence.
- 1:45–2:45, Today: choose the plot/cycle. Show preparation prompts, Why am I seeing this, and local feedback. Weather is optional, consented model estimates; missing coordinates or provider failure do not break records. No soil/NPK comes from GPS.
- 2:45–3:45, Records → Season review: select the demo soybean cycle. Synthetic totals show costs ₹1,800, receipts ₹2,800, harvest 100 kg and sold 70 kg. Receipts-minus-recorded-outlay is ₹1,000 and is explicitly not profit. Missing areas prevent per-area yield; no causal yield improvement is inferred.
- 3:45–4:30, Scan: upload an appropriate baseline-crop image or show camera controls. Explicit crop and image-sharing consent precede real server analysis. The current baseline is bell pepper/potato/tomato plus unsupported inputs; soybean/wheat/chickpea scanning is unavailable. Confidence is a score, not a diagnosis. No predicted class is fabricated when the server is missing or image/crop is unsupported.
- 4:30–5:00, My Farm/offline: show prepared backup/readability check and offline-ready status. Summarize the records and privacy flow, review/evidence gates and model limitations.

## Fallbacks

If internet fails, keep the local launcher running; farm screens and the already installed local model need no external API. Browser-cached screens/records also remain usable if the local server stops, but inference needs the local API. Weather stays unavailable; do not invent forecasts.

If model loading or a photograph fails, show the honest unavailable/unsupported state. Optionally choose Run labelled interface demo (no model), explicitly introduce it as an interface simulation, and save only its labelled demonstration summary. Simulated confidence and labels are not evaluated predictions or accuracy evidence. Real predictions/photos are not silently persisted to the farm timeline in this milestone.

If the device cannot deliver a backup file, use the prepared link on the actual presentation browser and verify the saved JSON there. The in-app QA browser did not expose a download event; do not claim that physical file delivery passed. Never delete records as a fallback. Use an already saved backup with the previewed import/conflict flow if recovery is needed.

## Honest answers for judges

Core software works locally and uses free open-source dependencies; training remains a separate Yashi workflow. The local baseline bundle loads and passes a synthetic transport/inference smoke, but that test is not field accuracy. Supplied metrics/license/model-card evidence and target-crop validation still need independent audit. Sensors, professional diagnosis, pesticide/fertilizer prescription, guaranteed yield gains and seed stock are not claimed.

Agronomy reviewer remains TBD. Candidate/timing frameworks are implemented and unit-tested, while real agricultural entries remain absent. Completion-aware catalog adoption/feedback and expanded soil-method/time contracts are future work, not features to invent for the exhibition.
