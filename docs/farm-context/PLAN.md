# Farm context and recommendations: implementation backlog

This phase extends the existing repository; it does not create a second disconnected app. This setup delivers task contracts and coordination, not a working recommendation engine.

## Active team

| Contributor | Work | Dependencies |
| --- | --- | --- |
| Arindam | Heavy work: location/consent, shared contracts, provider adapters, device ingestion, recommendation engine, result UI, integration, security, deployment | Implement contracts and weather independently; use reviewed research/catalog later |
| Kanika | Lighter work: normalized JSON audit utility, synthetic fixtures, QA plan/demo/risk package | Frozen CONTRACT.md; no live API or app code needed |
| Yashi | Lighter work: verified source/provider research, seed/action JSON schemas and draft examples | CONTRACT.md; final crop/region and reviewer remain TBD |

See tasks.json for exact branches, issues, mapped GitHub accounts and exclusive paths. Tasks 1–4 remain separate historical backlog; do not close or overwrite existing work. Anushka/Aanya are inactive this phase.

## Delivery order

1. Human owner merges this setup PR after review, activating the /claim workflow on main.
2. Contributors post /claim on their assigned issues and wait for bot assignment. Only one agent per contributor/account at a time. Separate clones/worktrees; no shared checkout.
3. Arindam defines implementation types matching CONTRACT.md and delivers consent/manual location with independent weather fetching. Kanika/Yashi work in their disjoint directories.
4. Arindam selects soil access using verified availability and licensing. Sensor integration requires actual hardware and authentication; otherwise unavailable.
5. Review evidence and catalog; unknown crops, target district, season, local seed availability and expert reviewer remain TBD. Draft catalog entries are blocked at runtime.
6. Arindam integrates explainable seed candidates and farm actions; Kanika executes device QA. Demonstrate failures and clearly labeled synthetic fallback.

## Scan experience to implement

Capture/upload → optional “Use location” consent or manual location/skip → disease screening plus separate context cards → soil-test/sensor inputs when available → reviewed seed candidates and action guidance with reasons, evidence, missing inputs and cautions. Location denial and provider failure never block scanning.

A current weather API is not a farm sensor. Soil maps are not laboratory measurements. No claim of “every data” coverage: each unavailable field stays unavailable. No NPK inference from GPS or photographs. Seed suitability needs region, season and water context; avoid promised yield or pesticide/fertilizer prescriptions.

## Candidate sources, verified 2026-10-05

- https://open-meteo.com/en/docs — current conditions are model estimates, with forecast variables; verify license/limits before integration.
- https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs.html — mapped soil properties at 250 m with uncertainty, not live readings.
- https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html — access/licensing; REST API is beta. Availability needs verification and a failure fallback.

Yashi must verify regional agronomic evidence before advice is enabled. No agricultural thresholds are supplied by this setup.
