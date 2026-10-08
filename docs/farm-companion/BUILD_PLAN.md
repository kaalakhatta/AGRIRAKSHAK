# AgriRakshak farm companion: full build plan

Planning baseline: 2026-10-05. Owner: Arindam. Active team: Arindam, Kanika, Yashi, Anushka, Aanya (owner reassignment 2026-10-08). This document defines the intended build; no module is complete merely because it appears here. It supersedes the disease-only product scope while preserving the scanner and existing backlog. Initial focus confirmed 2026-10-08: Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. Exhibition: October 9, 2026, around 14:00 IST. Owner asks for completion tonight or early morning; freeze the candidate by 08:00 IST for rehearsal. Named agronomy reviewer remains TBD.

## Product and constraints

Help a farmer plan, monitor and review a growing season through evidence-backed information and records. Disease screening is one tool within the companion. Support yield-improvement decisions without claiming guaranteed yields or quantified improvement without measured evidence.

Hard budget: zero paid APIs, subscriptions, credit-card requirements, paid AI endpoints or mandatory cloud databases. Free external data is optional enrichment; unavailable services must not break local records, calendars or scanning. Never switch to paid endpoints automatically. Use existing devices; physical sensors are optional and are not assumed free hardware.

Initial breadth: farm profile, weather briefing, seed/crop candidates, stage-based tasks, disease screening, soil notebook, expense diary and harvest records. Initial agronomic depth: Sehore and the three owner-selected crops. This is a planning focus, not established expert-reviewed advice or scanner coverage. Local records support other crops; agricultural guidance abstains outside reviewed coverage.

## Farmer journeys

| Journey | Flow | Result |
| --- | --- | --- |
| First visit | Choose language → add named field → consent to GPS or select/manual location or skip → confirm field location → crop, planting date/stage, water access | Local farm profile; explain what will be saved |
| Plan | Choose intended crop/season → add available water and optional soil results → compare reviewed seed candidates → start a crop cycle | Reasons, missing inputs, sowing-window guidance and calendar |
| Monitor | Open Today → weather context and due tasks → record an observation or scan a leaf → complete/dismiss tasks | Crop timeline and reviewed next steps |
| Improve | Enter soil-test values, costs, harvests and optional sales → review a cycle | Evidence of the farmer's own season, with gaps clearly shown |
| Offline | Open cached app → view cached catalog/tasks/records → add entries | Local work continues; weather/scans reflect actual availability |

GPS is the phone's position, not automatically the farm. Confirm field location and allow editing. No login gate. Request camera/location only after a related action. No background GPS tracking.

## Navigation and screens

Primary mobile navigation: Today, Plan, Scan, Records, My Farm. Desktop uses the same information structure.

- Today: active field/cycle, data freshness, weather outlook, prioritized reviewed actions, due tasks, missing-information prompts.
- Plan: crop/seed comparison, applicability and evidence, proposed crop calendar; no unsupported rankings or local availability claims.
- Scan: existing capture/upload and uncertainty behavior; optional linking to a cycle; context never overrides disease confidence.
- Records: observation/scan timeline, soil-test entries, costs, harvests, optional sales, simple cycle summaries.
- My Farm: fields/cycles, location consent, language, unit preferences, storage/export/import/delete, data sources and limitations.
- Recommendation detail: action, purpose, why applicable, timing, evidence, prerequisites, contraindications, alternatives and review date.
- Knowledge: searchable reviewed content linked from these screens; draft content only in explicitly separate developer demo mode.

Use short forms and progressive questions. A farmer can skip unknown soil or dates. Missing information affects only recommendations that require it. English first; store translation keys and language codes. Regional-language launch requires reviewed translations, not invented machine translations.

## Feature scope and order

| ID | Module | First deliverable | Later within the roadmap | Boundary |
| --- | --- | --- | --- | --- |
| F01 | Farm/field profile | One field, confirmed location/region, irrigation access, crop cycle | Multiple fields and archived cycles | Account/sync not required |
| F02 | Weather briefing | Current estimates and 7-day forecast, units/source/time, cache/failure labels | Weather-linked reviewed task prompts | No live station claims |
| F03 | Recommendation engine | Reviewed rules, applicability, missing-input explanations, actions | Seed comparisons and conflict handling across topics | No paid LLM or new ML required |
| F04 | Calendar | Tasks tied to planting date/stage; complete/snooze/not-applicable | Revised schedule after confirmed stage/date changes | Do not guess missing sowing dates |
| F05 | Crop/seed planning | Reviewed regional candidates and side-by-side facts | Expanded coverage after review | No yield ranking or availability guarantee |
| F06 | Disease screening | Preserve evaluated model contract and uncertainty; link scan summary to cycle | Validated browser/offline inference if feasible | Unavailable model means unavailable result |
| F07 | Soil notebook | Manually entered measured values, units, date/depth, source | Structured report import after validation | No field NPK/pH from GPS |
| F08 | Expense diary | Date/category/amount/currency/cycle; edit/delete | Category summaries and per-area costs | No inferred profitability |
| F09 | Harvest/outcome diary | Harvest date/quantity/unit, optional area and sale value | Within-farm comparisons with completeness notes | No causal attribution of yield change |
| F10 | Knowledge library | Reviewed prevention, establishment, water/soil/harvest guidance | Reviewed regional-language catalog | No pesticide/fertilizer prescriptions |
| F11 | Reminders | In-app due tasks | Opt-in local/browser notifications after capability checks | No paid SMS/WhatsApp; closed-app delivery not promised |
| F12 | Sensor telemetry | Honest unavailable state and separate labelled demo | Actual authenticated sensors if already available | Not needed for first release |
| F13 | Season review | Totals, missing records, observed harvest per area where valid | Farmer's own prior-cycle comparisons | Gross receipts minus recorded costs is not complete profit |

## Build sequence and acceptance gates

Effort is estimated team working days, not calendar promises; exhibition is October 9 at about 14:00 IST. Milestones are sequential release gates, not a claim that contributors must work serially.

| Milestone | Estimate | Arindam (heavy work) | Kanika (validation/QA) | Yashi (training/evidence) | Exit gate |
| --- | --- | --- | --- | --- | --- |
| M0: ready-to-build foundation | 1–2 days | Merge-ready plan, contracts, claim/scope workflow; choose region/crops/reviewer with owner | Contract fixture inventory and test traceability | Target-crop dataset/license feasibility; literature preservation | Human merges setup; real claim test; required scope check verified |
| M1: local farm foundation | 3–5 days | Profile/cycle screens, IndexedDB repositories, export/import/delete, location consent | Data audit and profile/privacy/import scenarios | Reproducible free Colab smoke workflow and evidence | Reload preserves local data; denial/skip works; corrupt import cannot damage records |
| M2: weather + daily guidance | 3–5 days | Weather adapter/cache, Today, rule evaluator v1, stale/missing/error states | Fake-clock/provider fixtures, engine result checks, mobile plan | Training/calibration and real evaluation reports | Weather failure isolated; only reviewed applicable rules render; evidence visible |
| M3: plan + monitor | 4–6 days | Seed comparison, calendar, action feedback, scanner-cycle integration | Candidate/stage/task conflicts and unsupported-region QA | ONNX export/model-card handoff; crop coverage gaps | Complete plan→monitor journey; draft/missing-input cases abstain |
| M4: records + season review | 3–5 days | Soil entry, observations, expenses, harvest/sales, summaries | Units, edits/deletes, duplicate import, backup and calculation scenarios | Independent model-evidence handoff to Anushka | Accurate totals from entered data; unknown area/costs stay unknown; export round-trip |
| M5: exhibition release | 2–4 days | Accessibility/offline/size checks, free hosting, release artifacts and rollback | Contract regression and traceability; Aanya executes device tests/rehearsals, Anushka audits model readiness | Verified model/source/license limitations for judge explanations | Three successful rehearsals; failures demonstrated; no fabricated features/results |

Total planning range: roughly 16–27 working days, highly dependent on model readiness, content review and device QA. If the deadline is shorter, M1–M3 plus essential M5 checks form the first demo; M4 can follow. Actual hardware sensors, report OCR, accounts, cloud sync, market price APIs and automatic yield prediction are post-release research, not dependencies.

## Team and repository coordination

Keep the existing repository; setup #12, roster #17 and training scopes #18 are merged into main. No second app/repo. Task 10/#11 is Arindam's cumulative build issue. Task 6/#9 is Kanika's farm-data audit/regression issue; Task 7/#10 is Yashi's Colab/training/evaluation/supporting-evidence issue. Task 11/#15 is Anushka's dataset/model audit; Task 12/#16 is Aanya's device/exhibition QA. Exact accounts, branches and exclusive paths are in tasks.json. Arindam owns all farm intelligence and catalogs; Yashi owns the eight research/ML scopes in tasks.json; Kanika supplies contract cases, Anushka audits split/model evidence, and Aanya executes device/rehearsal cases. Read their briefs and AGENT_START.md before work. Same fixed branches and non-overlapping teammate paths. Complete one milestone at a time with small reviewed PRs. For intermediate PRs use `Refs #<issue>` and a milestone ID; `Closes` only after the full cumulative task is done. Never merge through an agent.

Read [delivery protocol](DELIVERY.md), [data model](DATA_MODEL.md), [engine plan](RECOMMENDATION_ENGINE.md) and [architecture](../ARCHITECTURE.md). The v1 weather/soil audit contract remains in ../farm-context/CONTRACT.md; future farm-record schemas are separate and versioned.

## Confirmed coverage and pending owner decisions

Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. See SEHORE_INTELLIGENCE.md for the source boundary and runtime contract. Yashi must assess disease-training datasets separately; current pepper/potato/tomato training does not establish screening coverage for these crops.

Exhibition is October 9, 2026, around 14:00 IST, with an 08:00 IST candidate-freeze target. Pending: presentation devices; named agronomy reviewer; language priority; whether an evaluated model is already available and its license/size; whether farmer records will be retained on shared exhibition devices (default: synthetic demo only). Missing decisions do not block local profile, storage, weather or rule-framework implementation.
