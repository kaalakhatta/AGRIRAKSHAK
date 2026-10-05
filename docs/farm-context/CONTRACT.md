# Farm-context contract v1

Status: integration contract; implementations remain pending. Changes to this shared contract belong to Arindam. Teammates must report ambiguities rather than changing it.

## Context JSON

Top level: `schema_version` = "1", `synthetic` boolean, `collected_at` UTC ISO-8601 timestamp ending Z, `location`, `crop`, `season`, `water_availability`, `readings` array. Unknown crop/season/water are null, never inferred. Location is null when skipped; otherwise `{latitude, longitude, accuracy_m, method}` with finite coordinates in [-90,90]/[-180,180], nonnegative accuracy or null, method `gps` or `manual`. GPS requires explicit consent; manual location requires confirmation. Precise coordinates are transient and excluded from saved metadata/logs by default.

Each reading requires:

| Field | Values/meaning |
| --- | --- |
| id | Stable nonempty metric ID |
| value | Finite number, or null if unavailable/error |
| unit | Explicit unit; no implicit conversions |
| kind | weather_estimate, forecast, soil_map, soil_lab, sensor |
| status | available, stale, unavailable, error |
| source | `{name, url, version}`; nonempty name/URL; version nullable |
| observed_at | UTC timestamp, nullable only for unavailable/error; forecasts use model issuance time |
| fetched_at | UTC timestamp of fetch/input |
| valid_at | UTC forecast target timestamp; required for forecast, otherwise null |
| depth_cm | `{top, bottom}` finite, 0 <= top < bottom for soil_map/soil_lab; otherwise null unless sensor measures soil |
| uncertainty | `{lower, upper, unit}` or null; lower <= upper, same unit as value |

Unavailable/error values must be null. Stale values may be displayed with a warning but cannot satisfy a rule requiring fresh inputs. Source refresh age and reading age are separate. Future observed timestamps are invalid; forecast valid_at can be future. `collected_at` and `fetched_at` cannot be future relative to the validator's supplied clock. Soil maps have a dataset version, not a fabricated live observation time: use published reference date when known; if unknown, report unavailable until contract extension is reviewed. Soil units and depth cannot be silently equated across providers.

Initial metric IDs/normalized units: air_temperature/degC, relative_humidity/percent, precipitation/mm (explicit interval needed before rule use), wind_speed/m_s, soil_ph/pH, soil_sand/percent, soil_clay/percent, soil_organic_carbon/g_kg, soil_moisture/m3_m3. Units/IDs outside this list are flagged unsupported by v1. NPK availability requires actual measurements and an expanded reviewed contract.

## Soil-map applicability boundary

The v1 schema can represent a soil_map for regional educational context. It must never satisfy a rule requiring field soil measurements or support field-specific irrigation/nutrient recommendations. First-release field advice uses manually entered measured soil results; SoilGrids REST is not a runtime dependency.

## Recommendation output

`schema_version`, `catalog_version`, `generated_at`, `status` (candidates/abstained), `seed_candidates`, `actions`, `missing_inputs`, `cautions`. Each candidate/action includes stable catalog ID, reasons, evidence URLs, input reading IDs, applicability region/season and reviewer reference. Catalog schema belongs to Yashi; executable engine belongs to Arindam.

Only reviewed entries with reviewer identity/date, verified evidence and complete applicable inputs may render. Missing soil, unknown season/water, stale required data, unsupported crop/region, contradictory evidence or only draft content → abstain for the affected rule. Independent safe reviewed actions may still appear. No numeric ranking until reviewed scoring exists. Never derive seed suitability from disease confidence. Include “check locally with an agricultural expert” and explain uncertainty in plain language.

## Required scenario fixtures

Valid reviewed candidate; location denied/manual/skip; provider partial failure; stale weather; unavailable soil; soil depth mismatch; invalid units; no sensors; unsupported crop/region; draft catalog; conflicting evidence; offline cached data; synthetic demo. Synthetic values never count as real field observations. Never save real farmer locations in fixtures.
