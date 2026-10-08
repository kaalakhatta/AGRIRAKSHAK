# Sehore intelligence: ownership, coverage and first integration

Owner decision, 2026-10-08: focus Sehore, Madhya Pradesh, on soybean, wheat and gram/chickpea. Arindam owns farm-context binding, all catalog schemas/content, deterministic recommendations, seed/calendar guidance and runtime/API/scanner integration. Yashi owns free Colab training, calibration, evaluation, ONNX export and supporting research in the eight registered scopes. Tasks/issues/branches remain unchanged. Named agronomy reviewer: TBD.

## Evidence boundary

[District Sehore agriculture page](https://sehore.nic.in/en/agriculture/), accessed 2026-10-08, lists soybean among Kharif crops and wheat/gram among prominent Rabi crops. The page itself says last updated May 05, 2019: use this only as district background, not a current advisory, cultivar recommendation, sowing window or agronomic threshold. The page describes different agro-climatic zones within the district; district-wide soil/nutrient descriptions cannot become measurements for a farmer’s field. Current local evidence and real reviewer approval are still needed. No paid data dependency is introduced.

The existing trainer selects bell pepper, potato and tomato (ml/src/agrirakshak_ml/prepare_plantvillage.py). Selected companion crops do not establish model screening coverage. Task 7/Y1 must assess target-crop dataset/label/license/field-validation feasibility first. Keep the historical baseline and published literature attribution; do not relabel or fabricate metrics.

## Runtime slice

farm-guidance.ts binds a validated farm snapshot to one saved field and its selected cycle, using an explicit clock. Exact, case/space-normalized English aliases map soybean/soyabean, wheat and gram/chickpea/chana. Region accepts Sehore, Sehore with Madhya Pradesh/MP, or IN-MP-SEHORE. State-only Madhya Pradesh requires district confirmation. No fuzzy crop/location match, automatic farmer-field default, GPS lookup or season inference is performed. Existing records and personal reminders continue outside the focus.

Farm, field or cycle demo origin blocks agricultural guidance. Fresh weather must be explicitly bound to the same field; values preserve null/zero, weather-estimate provenance, observed time and precipitation interval. Crop-stage freshness uses stage_recorded_at, not an unrelated record edit. Forecasts have unknown issuance and remain display-only. Soil notebook dates do not supply a reviewed observation-time/method contract; no soil input is inferred. Scan confidence does not enter the farm evaluator.

The adapter calls engine-1 review/evidence/applicability/input/conflict checks. A displayed action also requires explicit reviewed crop, region and season applicability. Only matched actions expose title/action/reviewer/evidence; draft or blocked action text is not part of the display result. Malformed catalogs fail closed. Runtime uses EMPTY_CATALOG until genuinely reviewed content exists. Today and Plan display the coverage/readiness reasons without needing location permission. No persistence-schema change, model artifact or dependency addition.

## Validation and remaining delivery

Ten synthetic integration tests cover aliases, immutable inputs, reviewed fixture/empty runtime, foreign cycle/missing parent, all demo-parent cases, missing season, incomplete coverage, draft/rejected/unverified records, zero/null/foreign/stale/future weather, stage time, unknown water, absent soil/forecast/diagnosis inputs, conflicts and invalid clock/catalog. Fixtures use example.invalid evidence and a synthetic reviewer; they are never loaded by the app.

Remaining: genuine agronomy reviewer and current source-backed seed/action/calendar content; seed comparison/calendar contracts and reviewed-action feedback; evaluated target-crop model artifacts and independent audits; physical-device/weather/exhibition QA. This milestone establishes safe context integration, not completed agricultural advice or a deployed model.

Browser smoke on the isolated production build: created explicitly named synthetic Sehore/Soybean/Kharif records through the forms, selected the cycle in Today, then reopened the saved field/cycle in Plan. Both rendered the focus and missing-water/weather/reviewer reasons; Plan retained the personal reminder form and did not render crop actions. No GPS/weather permission or outbound provider request was used. This is desktop UI evidence, not physical-device or model QA.
