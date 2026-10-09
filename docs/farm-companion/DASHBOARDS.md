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
