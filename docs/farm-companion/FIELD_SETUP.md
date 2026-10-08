# Madhya Pradesh field setup — Task 10 / M1–M2–M3

Owner-requested first case, October 8–9, 2026: name a field → locate it on a Madhya Pradesh map → show lookup progress → display mapped soil and weather → choose soybean, wheat or gram/chickpea → save and show first planning steps. Keep cumulative #11 open. This does not change Yashi’s Colab/training/evaluation/export ownership.

## Implemented behavior

My Farm starts with the five-step setup. The interactive map loads only after an explicit map-loading action; manual coordinates and location skip remain available. The rectangular viewport is not an administrative-boundary check: the farmer confirms that the point represents their field in Madhya Pradesh. District is entered by the farmer, never inferred from the pin. Leaflet 1.9.4 is bundled locally (BSD-2-Clause); its type package is development-only (MIT).

The map uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) with visible attribution, normal browser caching and no offline/bulk tile download. Viewed areas and network address reach the tile provider; field names are not sent. A second explicit consent shares the point through the app server with Open-Meteo and ISRIC. Coordinates are POST bodies to fixed same-origin routes, not app query strings; the app does not log or persist them by default. Upstream coordinates are necessarily sent to the named providers. Local coordinate retention requires a separate checkbox; default backups still omit them.

Lookup progress reflects actual independent requests. Cancellation aborts pending requests and invalidates late responses. Soil and weather time out independently; either unavailable card allows continuing. No artificial minimum wait, fake weather, inferred nutrients or automatic paid fallback.

The soil card displays ISRIC’s WRB `MostProbable` mapped class. The fixed WMS GetFeatureInfo endpoint and GeoJSON format were checked against the published service capabilities and a live public synthetic test point. Only a known class, source, retrieval time and unknown reference year are returned; geometry is discarded. This is background map information, not a lab result, field texture/NPK/pH measurement or seed-suitability evidence. It is not stored as a measured soil test and does not enter the agronomic engine.

Weather uses the existing Open-Meteo units/time/interval parser, 30-minute transient cache, throttle, cancellation and bounded retry behavior. Browser-to-provider access failed in the in-app QA browser; this setup therefore uses the same free provider via a fixed app-server POST route. Current model estimates display temperature, humidity, precipitation with its interval, wind, validity time and freshness. Other existing weather controls retain their original direct transport. No station-observation or forecast-issuance time is invented.

Crop, intended season and water access are explicit inputs. A revision-checked atomic save appends the field and planned crop cycle while preserving existing records. Unknown dates, stage, area and variety remain unknown. Initial recommendations reuse preparation prompts for missing details, personal reminders and measured soil records; real seed/action/calendar catalogs remain empty pending genuine review. The current disease scanner does not support the three planning crops. Existing fields, editing and backups remain under “Manage existing fields, records and backups”; first-step edit links open that section.

## Validation evidence

- `npm run check`: lint, type checking, all 137 app tests and production/offline build passed. Seven added tests cover field/cycle atomicity, default privacy versus opt-in, skipped/unknown inputs, all three crops and rejection, preserved records, map extent, mapped-response provenance/failure, and weather POST transport/validation/privacy.
- Browser: real online map tiles and a selected pin rendered; progress screen appeared; ISRIC returned Vertisols. Direct weather failure was isolated. After server transport, both live cards rendered current estimates with temperature/humidity/rain interval/wind and source/time labels using public synthetic coordinates.
- Browser: soybean setup saved; location skip also saved a gram/chickpea cycle with unknown season/water. Reload retained both fields and cycles; both displayed “No coordinates saved”. No real farmer data, device location or photo was used. Cancellation returned to location setup; removing sharing consent showed both lookups as skipped rather than reusing old estimates.
- At 390 × 844, context and first steps wrapped with document width equal to viewport width (390px). This does not establish physical-phone, screen-reader, camera or backup-download QA.

Sources: [Leaflet stable release](https://leafletjs.com/download.html), [ISRIC data-access and license documentation](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html), [ISRIC map service](https://maps.isric.org/), [Open-Meteo API documentation](https://open-meteo.com/en/docs). Map/soil/weather requests require internet and the local Next server; an installed offline shell preserves local setup/records with unavailable online context. The new optional mapped-class lookup implements the owner’s requested case; earlier M2 releases did not fetch mapped soil.

Remaining outside this case: genuine reviewed operational advice, evaluated target-crop model handoff, precise administrative-boundary verification and actual-device rehearsal. No accuracy, agronomy review, training run or yield benefit is claimed by this delivery.
