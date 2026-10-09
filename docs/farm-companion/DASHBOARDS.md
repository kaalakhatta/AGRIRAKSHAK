# Crop and farm dashboards — Task 10 / M1, M2, M3, M4 partial

Owner requested these screens on 9 October 2026. The final clarification requires app-calculated estimates, rather than asking farmers to invent harvest or irrigation intervals. This slice retains schema 8 and all existing record/reminder management. It does not change teammate ownership, reviewed runtime catalogs or disease-model coverage.

## Journey and inputs

Field setup collects crop, season, optional area/unit, water access, planted variety, planting status and actual/planned sowing date. Past dates alone do not establish that planting occurred; Already sown explicitly creates an active cycle with unknown stage. Future dates with Already sown reject through the existing validator. Other soybean variety names can be recorded without making unsupported estimates.

A calendar appears immediately beneath the date/variety inputs. Save opens a crop overview with compact expandable preparation buttons, mandi prices/history, crop notes, weather and soil. Its rounded action opens `/today` as a full selected-field farm dashboard: combined seven-day forecast card, separate soil card, crop information/prices, season calendar and personal reminder controls, all existing scheme matching and profit scenario calculator. Section shortcuts aid navigation. Hash identifiers select local records; no coordinates enter app URLs. Existing Plan/Records/Scan and field management remain accessible.

The calculator prefills only saved area/unit. It retains exact decimal arithmetic and explicit yield/price/total-field-cost assumptions, with labelled sample numbers and no yield or profit guarantee. It does not write financial assumptions to diaries.

## Automatic maturity estimates

`season-estimates.ts` adds published maturity days to the sowing date using calendar-day arithmetic. It applies only to recorded soybean, confirmed Madhya Pradesh and Kharif, and one of nine matching Central Zone varieties in [ICAR-NSRI's AICRP variety table](https://icar-nsri.res.in/aicrps_var.html), checked 2026-10-09. Notification years span 2009–2019; page update date is unknown. Values are characteristics, not a reviewed seed recommendation. Unknown varieties, unsupported crops/regions or missing dates/seasons return unavailable. No table yield, resistance claim, arbitrary margin or current stage is inferred.

The UI labels the output an estimated maturity / harvest-planning window, cites the source and states that actual crop maturity/weather can change harvest timing. It does not issue a harvest instruction. Calendar dots mark sowing, the calculated window, actual personal reminders and available seven-day forecast rainfall. Full farm starts at the current month; Sowing and Harvest estimate jump to their dates. Reminder completion/edit/deletion and existing rescheduling gates remain intact.

[ICAR-NSRI's revised production bulletin (2023)](https://icar-nsri.res.in/pdfdoc/ExtensionBulletin2023E_2.pdf), checked 2026-10-09, identifies moisture sensitivity at seedling, flowering and pod filling. Educational notes summarize this and invite field observations. The water outlook calculates the available seven-day rain total and shows dated rain reports. It does not turn predicted rain into irrigation appointments. Exact field irrigation timing, quantities, reviewed stage actions and wheat/gram maturity characteristics remain unavailable pending measured field moisture and reviewed source rules. No fertilizer/pesticide dosage or fabricated expert approval is introduced.

## Real daily market prices

[Agmarknet](https://agmarknet.gov.in/) public reports were inspected and live-tested on 2026-10-09. Its official public client uses `https://api.agmarknet.gov.in/v1/`; the working no-key monthly report is `prices-and-arrivals/date-wise/specific-commodity`, with MP state ID 19 and crop IDs Soyabean 13, Wheat 1 and Bengal Gram(Gram)(Whole) 6. The request supplies public crop/state/month only. No field identifier, coordinates, name or diary reaches the market service. No paid fallback or new dependency.

The route fetches current and previous months independently, bounds time/response size and keeps a 15-minute server cache with shared pending requests and failure backoff. It verifies report commodity/state/month and explicit rupees-per-quintal columns. Invalid, NR, zero, future and outside-30-day rows do not become prices. Independent month failure yields visibly partial history; both failures return unavailable.

Reports are separated by mandi and market variety (different from planted cultivar). Duplicate same-day reports remain individual modal prices. The latest display shows a modal range when several reports exist; reported minimum/maximum describe their envelope, not a transaction offer. The chart plots actual modal points and same-day ranges, with an accessible table; missing dates are not interpolated. Sehore fields initially show Sehore APMC and its latest reporting variety; other regions choose a mandi. Refresh preserves a selected mandi/variety if still present. Report date, retrieval time and older-than-three-calendar-days labels are visible. Three days is a display freshness cue, not a guarantee of official publication cadence. This is a daily reported price feed, not real-time trading data, an MSP assertion or a promised selling price.

## Context and privacy

Weather and mapped soil still use fixed consented POST routes and independent failures. The full dashboard needs explicit consent before a new lookup, including when coordinates were remembered. Measured tests, mapped WRB classes and weather model estimates remain separate. Missing pH/nutrients stay unavailable; demo tests stay labelled.

A click from crop to farm can transfer already-fetched weather/soil through a bounded, versioned, one-use same-tab sessionStorage envelope. Validation binds it to exact local field/cycle IDs, preserves original source times, strips unrecognized properties/coordinates, rejects expired/future/malformed data, and removes the envelope when consumed. Maximum age is 30 minutes; it is not an offline weather archive or farm backup. Blocked storage does not block navigation. No precise point, name, diary or photo enters this transfer, and it grants no further network consent. Field/cycle switches reset context and scheme answers; stopping context clears the current display. Precise location retention continues to require the existing explicit Remember opt-in.

## Validation

Final `npm run check` passed lint, typecheck, 163 app tests and production build. Seven new tests cover public crop/state IDs, market/variety/duplicate isolation and immutability, source/unit/date/NR rejection, independent month failure, calculated dates/leap years and missing applicability, Monday-first grids and own-cycle reminders, and one-use time-preserving coordinate-free transfer including expiry/malformed/blocked-storage cases. Existing schema migrations, privacy, calendar rescheduling, scheme matching and exact money tests pass. Offline pack `54f0aaf4fe9a2d24093f` includes six pages and 23 app assets. No new dependency or storage migration.

Live local market route smoke returned HTTP 200 for soybean/wheat/chickpea with Sehore reports. Soybean latest Yellow reports on 2026-10-08 were ₹6,000 and ₹6,100 per quintal; these are dated smoke results, not fixture defaults. Wheat's previous-month request was unavailable during that run and partial history was labelled. These network checks supplement deterministic fixture tests; CI never requires the providers to be online.

Browser evidence and remaining device gaps are recorded in CORE_STATUS.md. Keep cumulative #11 open. Human-reviewed actionable agronomy, field-specific irrigation schedules, current scheme notifications, target-grain screening validation and physical-device/rehearsal evidence remain pending.

## Unified dashboard follow-up — 2026-10-09

Supersedes the two-screen journey above. Setup no longer renders a calendar or maturity banner when the sowing date is selected. Saving redirects directly to `/today` with the saved local field/cycle identifiers. It transfers already-fetched weather/soil through the same time-preserving, coordinate-free envelope. All crop prices, notes, forecasts, soil, schemes, calculator, calendar and reminder controls now share the existing full dashboard. A failed/blocked optional tab preference cannot prevent saved records or navigation.

### Wheat and gram characteristics

The variety selector and maturity calculator now cover four wheat and four gram entries as well as the existing nine soybean entries. MP/Rabi and an exact recorded variety are required for wheat/gram; other varieties/regions/seasons remain unavailable. Published production conditions are shown next to the calculated dates. These are published characteristics with context caveats, not recommendations to plant a listed variety or a field-calibrated forecast.

Verified 2026-10-09: ICAR-IARI **Technological Options for Enhanced Productivity and Profit (2014)**, printed pp.7–8 / PDF pp.14–15, [official publication](https://www.iari.res.in/files/Publication/Others/Tech_Options_English-15072014.pdf). Wheat: HI 1544/Purna 110–115 days (timely sown, irrigated); HD 2932/Pusa Wheat 111 105–110 (late sown, irrigated); HI 8638/Malavkranti 120–125 and HI 1531/Harshita 130–135 (early sown, rainfed/restricted irrigation). The source is historical and does not establish current seed availability or suitability.

[ICAR-IIPR variety page](https://www.icar-iipr.org.in/varity/) lists Central Zone gram: IPCK 2002-29/Shubhra and IPCK 2004-29/Ujjawal 105–115 days (timely sown, irrigated); IPC 2006-77 115–120 (late sown, irrigated). [ICAR's Pusa JG 16 release article](https://icar.org.in/en/icar-iari-develops-climate-smart-drought-hardy-chickpea-variety-pusa-jg-16) gives 110 days in its Central Zone drought-stress context. **Pusa JG 16 is not JG 16**; the latter does not match this entry. No yield, resistance or seed-selection claims are imported. Pages' last-update dates are unknown.

### Automatic initial mandi

`market-towns.ts` contains 164 small public reference entries, joining official MP Agmarknet market names/districts (`https://api.agmarknet.gov.in/v1/market-district-state`) to unique MP town names/aliases in GeoNames `cities500.zip` (India / admin1 35), checked 2026-10-09. Raw gazetteer downloads and working files remain outside Git. [GeoNames directory and format/license](https://download.geonames.org/export/dump/readme.txt), CC BY 4.0, states its completeness/accuracy limitations. These points are **town centres, not verified mandi gates**. Ambiguous/unmatched names and fruit/vegetable variants are omitted; no fuzzy city match or invented point.

Distance ranking uses Haversine locally and selects the nearest mapped **reporting** town for the chosen crop. Unmapped/closer markets may exist and straight-line distance is not road distance. Without a point, a district reporting match is used; otherwise the most recent MP report opens with an explicit fallback label. The latest reported variety is selected automatically, so wheat and gram prices appear without first choosing a market. Refresh preserves manual market/grade choices.

During crop selection a public MP crop report is prefetched to warm the dashboard cache. During setup only one selected public market name is retained in optional same-tab sessionStorage under the local field ID. No coordinates, distances, farmer name or diary are retained in that preference or sent to the market provider. Full distance rankings are never retained. If the prefetch is not ready, the closest mapped town name is used; absent crop reports there fall back visibly to district/latest data. Saved opt-in coordinates can be ranked directly after reload. Invalid/malformed/blocked tab storage safely falls back to district/latest reporting data. No claim of exact nearest mandi is made.

### Middle-month planning checks

The calendar adds weekly observation check-ins from the sowing date, stopping at the published maturity endpoint or a selectable planning horizon (default 20 weeks). A sowing-date soil/manure **plan review** and every fourth weekly crop-nutrition/pest review organise the diary. A monthly agenda and distinct check-in markers make intervening months useful. The weekly spacing and horizon are app organisation choices, **not published agronomic intervals or inferred growth-stage dates**. They do not modify stored growth stage or automatically create/adopt reviewed CalendarTasks.

Pesticide spray and manure application dates remain unassigned because need, approval and field evidence are absent. Check-ins ask for observed pest damage/counts, actual stage, weeds, drainage/moisture and soil-test gaps. Existing season reminders can record an advisor-approved appointment; no product, concentration, fertilizer/manure amount or unreviewed treatment is prescribed. Operational rules still require genuine agronomy review. Personal reminders and completion history remain intact.

Follow-up validation: `npm run check` passes lint/typecheck/167 app tests/production build; offline pack `cb8bf43baf3451dc2517` has six pages and 23 assets. Browser fictional wheat/gram setup saved directly to the full dashboard, automatically opened Ashta reports, and showed sourced calculated dates plus December observation check-ins. Final pack update retained eight original-and-QA fields and selected-market behaviour. At 390px and 320px the document width matched the viewport; overrides were reset. CORE_STATUS.md records exact observations and remaining physical-device/review gaps. No external provider is required for deterministic tests.
