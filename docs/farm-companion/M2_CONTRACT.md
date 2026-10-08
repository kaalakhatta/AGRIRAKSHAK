# M2 runtime handoff

Owner contracts, 2026-10-05. Context v1 and teammate catalogs remain unchanged. Yashi's catalog schema is still pending; `engine-1` is an owner evaluator handoff proposal, not a claim that catalog integration is complete.

## Weather v1

`apps/web/lib/providers/weather.ts` requests Open-Meteo directly from the browser after separate consent. No account/key/proxy/dependency is needed. Requests specify GMT, m/s and seven days; seven weather variables total. Values are validated against explicit units and bounds. Missing values stay null. Source URL is a fixed attribution link; returned grid coordinates and request URLs are never copied into records, logs, exports or persisted caches.

Current values have their provider validity timestamp and precipitation interval. Forecast rows retain UTC dates and daily accumulation units. The default endpoint does not supply a model issuance timestamp: `issued_at` is null. These forecasts are display-only and do not satisfy context-v1 rules requiring known issuance. Retrieval time does not replace observation/issuance time. Context v1 is not silently extended.

30-minute cache/freshness and one-minute throttle are engineering network policies. A session-wide client shares the throttle across field selections; reload starts a new browser session, so this does not enforce aggregate provider limits. Cache is memory-only. Location/field edits remount the panel, discard displayed/cache data and consent. Navigating from My Farm to Today clears page-local transient coordinates; use the embedded field overview for session-only location, or explicitly retain coordinates before navigating. Saved coordinates never imply weather consent.

Each attempt has an eight-second abort timeout, one delayed retry only for network/5xx failures. 429 uses Retry-After without automatic retry. Cached estimates remain displayed after refresh failure and stale after 30 minutes. Consent revocation aborts pending requests and prevents cache repopulation; already transmitted requests cannot be recalled. Field records and scanning remain independent of weather errors. No soil-map or sensor endpoint exists.

Sources: [Open-Meteo docs](https://open-meteo.com/en/docs), [free non-commercial limits](https://open-meteo.com/en/pricing), [attribution license](https://creativecommons.org/licenses/by/4.0/).

## Evaluator engine-1

`apps/web/lib/recommendations/engine.ts` validates catalogs before evaluation. It accepts allowlisted declarative operators; all condition/applicability references must declare required inputs. Exact normalized units are required; implicit conversion is forbidden. Required inputs specify allowed provenance, maximum observation age, optional exact soil depth and precipitation interval. There is no eval/function/code loading from backups.

All rules must have reviewed state, reviewer/date, non-future review time, verified evidence and supported coverage. Missing inputs, stale/future timestamps, wrong units/depth/interval, maps substituting for measurements, synthetic evidence and another field's inputs abstain. Conflicting actions are suppressed because no reviewed precedence protocol exists. Results include deterministic statuses, reasons, source URLs and required input IDs. The runtime catalog is empty; fixture reviewer identities and thresholds are explicitly synthetic test data and are never loaded by the app. UI information prompts make no agronomic claims.

Pending catalog-author agreement: stable crop/region IDs, translations/action windows, optional-input conventions, reviewed deduplication/precedence and feedback persistence. These and seed/calendar integration belong to M3. Forecast-rule support needs a separate provenance contract decision. No ranking, seed advice, yield uplift, dosage or expert approval is fabricated.

## Reproduction and acceptance

Run `npm run check`. Tests use fake HTTP and clocks, not network CI. Open `/today`, select a saved field, select a cycle. Without coordinates, weather is unavailable while information prompts work. With confirmed coordinates, Fetch remains disabled until the separate consent checkbox is selected. Fetch, inspect source/time/units and forecast rows. Uncheck sharing or use Stop to clear the cache. Refresh is locally throttled. In `/farm`, Open field overview also works with transient coordinates.

Physical-device GPS, screenreader, provider outages on-device, actual file downloads and offline installation remain independent QA work. Memory cache does not provide offline persistence or an installed app; those are M5.

### Observed 2026-10-05

`npm run check`: lint/typecheck, 23 passing tests, static production routes `/`, `/farm`, `/today`. Live HTTP smoke with synthetic 0,0: HTTP 200; parsed current + seven-day response. An Origin-header probe returned `access-control-allow-origin: *`. Neither response fixture nor screenshot was committed.

In-app browser: selected both synthetic test fields/cycles, confirmed weather Fetch disabled until consent, saw unavailable weather without location, initiated synthetic-location weather fetch, observed a safe network-failure message with records/prompts intact, revoked sharing and verified disabled/reset state, reloaded and confirmed session reset. Successful browser fetch/render was not achieved; do not count it as passed. Viewport inspection was inconclusive in this browser surface; physical-phone QA remains pending. Screenshot at `/tmp/agrirakshak-m2-today.jpg` is outside Git.
