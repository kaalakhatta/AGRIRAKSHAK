# Explainable recommendation engine plan

Status: implementation specification. No extra trained recommendation model or paid language-model API is required. Keep the existing disease model separate. Agronomic thresholds and advice must come from reviewed evidence, never from this planning document.

## Topics and output

Support establishment/seed planning, sowing windows, water planning, soil testing/health, scouting/prevention, harvest/post-harvest handling, and record-quality prompts. Distinguish practical data prompts (“add your planting date”) from agricultural advice; the former do not require agronomic claims.

Farmer groups: Check today, Plan this week, Prepare for next season, and Missing information. These are presentation groups driven by reviewed timing, not invented agronomic urgency. Each recommendation includes what/purpose, why applicable, timing, source/reviewer, inputs used, missing inputs, cautions and feedback controls. Never calculate a yield-uplift percentage.

## Versioned rule shape

Arindam owns catalog schemas and the evaluator; the declarative structure is:

- id, version, topic, title/text translation keys; crop/variety/region/stage/season applicability.
- required_inputs and optional_inputs, expected units/depth/source kinds, maximum ages where meaningful.
- conditions from a small allowlisted operator set: eq, in, exists, lt/lte/gt/gte, all/any. No arbitrary JS, SQL, eval or text instructions.
- contraindications, conflict_group, reviewed priority/category, action window, evidence IDs, review state and reviewer/date.
- outcome/action text, explanation template, missing-input text and referral guidance.

Validate entire catalog before use. Unrecognized operators/units/references reject the entry; do not guess a conversion. No imported farmer file can become executable rule content. Soil-map source kind cannot satisfy a condition requiring field measurements.

## Evaluation pipeline

1. Build an immutable snapshot of farm/cycle/user entries and context v1; bind a supplied clock and timezone.
2. Select only reviewed, source-backed catalog entries with valid reviewer/date and supported coverage/language.
3. Check applicability. Crop/region/season/stage mismatch produces ineligible; unknown required applicability produces needs_input.
4. Normalize supported units explicitly, then check freshness, measurement depth, provenance and required inputs. A stale field reading does not become fresh because fetched_at changed.
5. Evaluate conditions and contraindications. Unknown produces needs_input, never false/zero; prohibited source kind or contraindication blocks the rule.
6. Resolve conflicts. Prefer explicitly reviewed precedence only; otherwise suppress competing actions and explain the need for expert review. Never display contradictory irrigation actions together.
7. Deduplicate related actions and respect feedback. “Done” is cycle/window-specific; weather/stage changes can trigger a new review, without repeatedly showing the same task on refresh.
8. Return deterministic results, reasons, evidence, and rule statuses matched/ineligible/needs_input/stale/blocked/unreviewed. Create visible groups and keep a diagnostic trace for local debugging.

Input/catalog changes invalidate a run; cache keys include field/cycle revision, context revision, catalog version and time window. Identical inputs and clock yield identical decisions. Multi-field state is isolated.

## Seeds and crop calendar

Start with unranked eligible candidates and comparison facts verified for the selected region/season. Required inputs are defined per reviewed entry; one missing optional input must not block all rules. Do not claim seed stock, dealer availability, guaranteed resistance or yield. No generic internet crop dataset is a substitute for local variety evidence.

Calendar templates use reviewed crop-stage windows and dependencies. An unknown sowing date shows stage-based tasks only after farmer stage confirmation. Date/stage changes preview rescheduling, preserve completed work, and ask the farmer to resolve inconsistencies. A forecast informs short-horizon actions, not the whole season's crop suitability by itself.

## Soil, water and disease boundaries

Use measured soil data for field-specific soil actions. Optional regional maps are background only. Modelled moisture is explicitly labelled; no fixed irrigation volumes or fertilizer/pesticide prescriptions. Crop-stage guidance and weather-linked rules need reviewed crop/region evidence. Disease confidence is not recommendation confidence; unsupported/uncertain scans retain that message and cannot silently establish a diagnosis.

## Tests and review

Arindam writes unit tests for rule decisions, conflicts, freshness, supported unit conversions, date windows and invalidated caches; provider tests use HTTP fixtures, never live network CI. Kanika supplies independent positive/negative scenario fixtures and audits output completeness. Yashi supplies supporting source/model evidence; Arindam authors farm rules and obtains actual agronomic review; only genuinely reviewed records enter runtime catalogs.

Required negative cases: unknown season, denied location, unsupported region, draft/rejected entries, missing reviewer, wrong unit/depth/source kind, stale/future observations, conflicting actions, rule injection, mixed field inputs, synthetic-only data. Synthetic demo runs live in a separate labelled mode and never become real farmer advice.
