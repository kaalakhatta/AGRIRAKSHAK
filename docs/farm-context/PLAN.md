# Farm companion phase entry point

AgriRakshak expands from a scan-centric app into Plan → Monitor → Improve: local field/crop-cycle profiles, free weather context, reviewed seed/action rules, crop calendars, scanning, measured soil entries, expenses and harvest records.

The canonical whole-build plan is [BUILD_PLAN.md](../farm-companion/BUILD_PLAN.md). Read its [data model](../farm-companion/DATA_MODEL.md), [engine specification](../farm-companion/RECOMMENDATION_ENGINE.md) and [repository/delivery protocol](../farm-companion/DELIVERY.md). This setup defines future implementation; it does not deliver runtime features.

## Team and issues

| Contributor | Cumulative task | Exclusive teammate paths |
| --- | --- | --- |
| Arindam | Task 10 / issue #11: all heavy core implementation/integration | Repository-wide owner scope; coordinate teammate overlap |
| Kanika | Task 6 / issue #9: data audit and full companion QA | ml/farm_context_audit/**; docs/exhibition/farm-context/** |
| Yashi | Task 7 / issue #10: research and full companion content/catalog | docs/research/farm-context/**; data/catalog/farm-context/** |

Exact accounts, branches and issue numbers remain in tasks.json. Anushka/Aanya are inactive; historical Tasks 1–4 remain intact. Reuse the existing setup PR #12 and issues; no competing branches or duplicate task issues. /claim activates after human merge; one active agent per contributor/account and separate writable checkouts are still required. Use Refs for intermediate milestone PRs and Closes only for full task completion.

## Important constraints

Zero paid APIs/subscriptions/card-required services. Local records/calendar/catalog run without cloud accounts. Optional weather uses Open-Meteo's free non-commercial service within limits and attribution; no paid fallback. SoilGrids REST is paused and ISRIC advises against farm-level use; no field soil advice from maps. Use manual measured soil results first. Physical sensors are optional and require existing hardware. No new recommendation ML model is necessary.

Source facts checked 2026-10-05: https://open-meteo.com/en/pricing ; https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html ; https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_04.html .

Context v1 in CONTRACT.md remains the weather/soil audit interface. Farm entities are separately versioned; no silent schema changes. Region, up to three crops, expert reviewer, exhibition date/device and language priorities remain TBD; independent platform work proceeds while evidence-dependent advice abstains.
