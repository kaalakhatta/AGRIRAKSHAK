# Authoring farm-planning content

Owner: Arindam / Task 10. Initial focus: Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. Agronomy reviewer remains TBD. This guide defines an implemented content contract; it supplies no cultivars, agricultural thresholds or expert approval.

## Canonical contract and validation

`apps/web/lib/recommendations/planning.ts` owns the `planning-1` TypeScript contract and runtime validator. Rules reuse the `engine-1` contract in `engine.ts`; field/cycle binding uses `farm-guidance.ts`. Independent JSON Schema files are not implemented in this slice: do not substitute an untested schema or infer that passing structural validation establishes expert review.

From the repository root with Node.js 24+, run:

```bash
node scripts/validate-planning-catalog.mjs
node scripts/validate-planning-catalog.mjs /path/to/owner-catalog.json
node --test apps/web/tests/planning.test.mjs
```

The CLI uses only built-in Node APIs, limits input to 1 MB and fails on invalid structure. It reports declared review states, not verified approval, applicable advice or test outcomes. The default `planning.empty.json` matches the empty runtime constant. Real content is introduced through an owner-reviewed code/content PR; farmer backups cannot provide executable catalogs. No network fetch, AI service or subscription is needed.

## Envelope and evidence

Exact top-level keys: `schema_version: "planning-1"`, nonempty `version`, `evidence`, `seeds`, `calendar`. Combined seed/calendar entries are bounded to 1,000. Unknown metadata keys and future versions reject the whole catalog. All rule IDs are unique across both collections; seed variety IDs are unique and fact keys are unique within an entry.

Each evidence record contains exactly:

| Key | Requirement |
| --- | --- |
| id | Stable nonempty ID, unique across evidence |
| url | HTTPS source URL without embedded credentials |
| verified | Boolean reflecting actual source verification; never set true for an unopened source |
| claim | Exact claim supported by the source, with its limits; nonempty plain text |
| accessed_on | Real YYYY-MM-DD date, recorded using UTC; future dates block referenced entries |
| license | Verified license/attribution or an explicit unresolved gap; a string is not legal clearance |

Preserve source/version/access details and reviewer packets with the content PR. An unresolved licensing/reviewer gap means keep the associated rule draft; passing validation cannot resolve it. Generic district background cannot establish cultivar suitability or field soil properties.

## Shared rule

Each seed/calendar entry contains an `engine-1` rule with exactly: `id`, `version`, `title`, `action`, `review`, `evidence`, `applicability`, `required_inputs`, `condition`, `contraindications`, `conflict_group`. `review` has `status` (draft/reviewed/rejected), `reviewer` and `reviewed_at` (real UTC time or null).

Every entry declares crop, region and season applicability. Initial normalized crop IDs are `soybean`, `wheat`, `chickpea`; region is `IN-MP-SEHORE`. Seasons are normalized from farmer-entered text, not inferred. All applicability/condition references must declare their required inputs. Required units/kinds/timestamps/depth/interval/freshness are checked by the existing evaluator; conditions use only its allowlisted operators. Optional-input, precedence, completion-dependency and translated-content protocols are not implemented; proposing them requires a versioned contract change.

Reviewed status requires an actual identified agronomy reviewer, valid review date and verified sources. Approval must cover the entire entry, including comparison facts, cautions and timing. An automated test's synthetic reviewer is never real review. Draft/rejected/unverified/mismatched/incomplete/stale/conflicting entries cannot expose action text or cultivar facts through planner output. Record and demonstrate negative cases before promoting content.

Available input IDs in this slice: crop, region, season, variety, water_availability, stage, air_temperature, relative_humidity, precipitation and wind_speed. Weather is fresh, same-field model estimates; precipitation retains its interval. No soil-map/lab input, forecast issuance, disease confidence or GPS-derived soil values are synthesized. Required absent inputs cause abstention for that entry, while independent eligible entries may still appear.

## Seed comparison entries

Exact entry keys: `rule`, `variety_id`, `variety_name`, `facts`, `cautions`.

- Required water input: `water_availability`, unit text, source kinds exactly [user]. The rule defines supported water conditions from reviewed evidence; unknown access never passes.
- `facts` is a nonempty array (maximum 50) of exact `key`, `label`, `value`, `evidence` fields. Every fact cites one or more IDs already referenced by the entry's reviewed rule. Text is bounded to 2,000 characters. Facts render as escaped plain text with source links.
- `cautions` is an array of bounded nonempty strings (maximum 50). No ranking/score field is accepted. Eligible candidates display alphabetically, never ordered by inferred suitability, confidence or yield.
- Actual seed stock, dealer availability, resistance/efficacy or yield promises are excluded. Soil/water/sowing requirements need applicable verified evidence and genuine review; missing soil stays missing.

## Crop-calendar entries

Exact entry keys: `rule`, `timing`, `cautions`.

`timing` is exactly one of:

```json
{"kind": "sowing", "start_day": 0, "end_day": 0}
```

```json
{"kind": "stage", "stage": "vegetative"}
```

These examples demonstrate shape only. Zero offsets and the stage name are not recommended operations or crop timing. Every real offset/stage/action requires supporting evidence and human review.

Sowing offsets are signed whole days within ±3,650, with start <= end (software bounds, not crop thresholds). The actual farmer-entered sowing date anchors both ends; no date means no dated proposal. Date windows use the farm timezone and calendar-date arithmetic. Passed windows suppress actions; the app does not invent catch-up advice or infer urgency. Future windows remain previews.

Stage entries require a declared stage input (text, kinds exactly [user]) with a reviewer-specified positive maximum age. Unknown, future, stale or mismatched stage confirmation blocks the template. An unrelated cycle edit cannot refresh `stage_recorded_at`. Stage guidance has no invented date. Unsupported dependency or precedence fields reject rather than silently taking effect.

Calendar previews do not create, edit, reschedule or mark personal reminders done. Completion-aware adoption, template links, conflict resolution against personal tasks and reviewed-action feedback require a separate storage/UI delivery. Existing personal reminders and completed history remain independent.

## Review packet before runtime content

Provide source URLs/access/version/license/claim limits; supported crop/region/season and every input prerequisite; all facts/actions/cautions/timing with reviewer identity/date; negative missing/stale/conflicting scenarios; and release/catalog version. Keep unknowns visible. No fertilizer dosage, pesticide product/concentration/dosage, fabricated expert approval or quantified yield improvement. Keep datasets/model weights/user photos/precise farmer locations out of Git. Disease training remains Yashi's separate task and does not certify farm-planning content.
