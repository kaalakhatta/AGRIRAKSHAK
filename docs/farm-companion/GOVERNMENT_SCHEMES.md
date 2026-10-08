# Government support matched to a saved field

Task 10 / M3 supporting feature. Owner clarified that schemes should follow the farmer's field setup, not just appear as a public directory. Sources checked 2026-10-09. This service screens published conditions locally; it cannot approve applications, establish official beneficiary status or guarantee payments. It is independent of agronomic review and disease-model coverage.

## Journey and records

My Farm saves the field/cycle, then immediately shows scheme matching. Home → Schemes selects a saved field and its crop cycle. The selected district, crop and season affect the results; changing fields/cycles resets extra answers. Optional area now saves through the existing schema-8 field contract; it is not used as total household landholding or to calculate a subsidy. Water access and having a usable irrigation source are separate questions. Location skipping/manual region works; the matcher does not need precise coordinates, soil maps, weather, paid APIs or a new dependency.

Ask extra questions only in the scheme section: cultivation arrangement, household recorded land, the published income-support acquisition routes and individual exclusions, plus irrigation history and relevant projects. Questions allow unknown/skip. Do not infer household ownership from the selected field's tenancy. MTS/Class IV/Group D employment/pension exceptions are explicit. The household definition, elected-office list and inheritance route accompany the questions. Answers remain in component memory, never in backups, storage, links, provider requests or logs. Leaving/reloading the page or changing field/cycle resets them. Persistent supplementary profiles would need a future versioned privacy/backup contract.

## Decision states

- Potential match: supplied answers meet the screened conditions. Official verification still applies.
- More details needed: required answers or crop/district/season are missing. Unknown never becomes No.
- Does not match these conditions: at least one known condition fails; the reason remains accessible. A known failure takes priority over missing unrelated answers.
- Check with the office: local selection, component rules or insurance notification remain unverified. No application deadline is invented; links lead to official information/contact details.

National schemes may apply outside MP, but this service's regional matching is currently MP-only. Missing state allows manual confirmation without GPS. Crop cycles must belong to the selected field. The app requires programme information to be rechecked after 90 days, or when its check date/clock is invalid; this is an internal editorial policy, not a government eligibility condition. Older publication dates remain visible alongside the actual source check date.

## Catalogue and sources

Sixteen programme entries cover the current general farmer/soybean/wheat/gram journey. The UI names this coverage and links the [full official MP directory](https://cmhelpline.mp.gov.in/KnowYourEntitleGrid.aspx?pointvalue=2&status=byschemefor). It does not claim an exhaustive current inventory of every horticulture, livestock, electricity or district programme.

| Programme | Official source / screening boundary |
| --- | --- |
| PM-KISAN | [Operational guidance](https://fw.pmkisan.gov.in/Documents/Revised%20Operational%20Guidelines%20-%20PM-Kisan%20Scheme.pdf), [current exclusions](https://pmkisan.gov.in/). Recorded cultivable family land, acquisition route and exclusions; no obsolete general two-hectare cap. Revenue office verifies records, family and status. |
| MP Kisan Kalyan | [MP scheme 606](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=606). Shares PM-KISAN conditions; source updated 2024-08-28. Patwari/tehsil verifies state enrolment; no assumed simultaneous payment. |
| KCC | [Department of Financial Services](https://www.financialservices.gov.in/agriculture-credit), [2026 programme information](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=157771&lang=1&reg=3). Owners, tenants, oral lessees and sharecroppers; lender assesses approval/rates. |
| PMFBY | [PIB national information](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2237736&lang=1&reg=3), [tenant coverage](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2099763&lang=2&reg=3). Requires actual notified crop/area/season and current deadline; Sehore coverage is not assumed. |
| RWBCIS | [PIB weather-index insurance](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2304549&lang=1&reg=48). Requires notification/term sheet; forecast is not a claim calculator. |
| Soil Health Card | [Official FAQ](https://soilhealth.dac.gov.in/files/FAQ_Final_English.pdf). Local testing arrangements confirmed by office/lab; mapped soil cannot satisfy a laboratory test. |
| AIF | [PIB AIF](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2113716&lang=1&reg=3). Infrastructure-project interest prompts lender/project assessment, not grant approval. |
| PM-KUSUM | [MNRE](https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/). Component, extension and window unverified after the listed 2026-03-31 period; no Apply-now claim. |
| MP Per Drop More Crop | [MP scheme 98](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=98), updated 2026-05-20. Own land, irrigation source, no irrigation-equipment benefit in preceding seven years; lottery and approved cost limits remain office checks. |
| Balram Tal | [MP scheme 92](https://cmhelpline.mp.gov.in/KnowYourEntitleDetail.aspx?Schemeid=92&pointvalue=2&status=byschemefor). Pond with drip/sprinkler; source dated 2022. Official district rate descriptions differ, so amounts are not calculated. |
| Seed Village | [MP scheme 856](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=856), updated 2026-05-20. Own-land route; clarify one-acre support coverage and current seed supply locally rather than excluding larger holdings by guess. |
| Food & Nutrition Security | [MP scheme 834](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=834). Screen listed crop groups, including wheat and chickpea; identified district/component/selection unverified. |
| Oilseed mission | [MP scheme 865](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=865), updated 2026-05-20. Oilseed group including soybean; current mission/component, district allocation and selection checked locally. |
| ATMA | [MP scheme 843](https://cmhelpline.mp.gov.in/Schmedetail.aspx?Schemeid=843). Training/demonstrations via block manager/project director; current sessions/rural coverage remain office checks. |
| PKVY | [MP scheme 828](https://cmhelpline.mp.gov.in/KnowYourEntitleDetail.aspx?Schemeid=828&pointvalue=2&status=byschemefor). Own-land/group route; dated 2022, no blanket cash or 100% grant promise. |
| MP machinery subsidy programmes | [MP agricultural engineering](https://mpdage.mp.gov.in/), [official farmer portal](https://farmer.mpdage.mp.gov.in/). Equipment-specific requirements, deposit/lottery/past benefits need verification, so never marked as fully screened. |

Generic agricultural term loans/warehouse bank products remain in secondary general browsing, separate from these government matches. All exact rule predicates and provenance live in apps/web/lib/content/scheme-catalog.ts; the pure evaluator is in lib/domain/scheme-matching.ts. Missing current notifications and incomplete rule sets stay visible.

## Validation and remaining work

Nine deterministic tests cover household vs field ownership, every exclusion/unknown, acquisition routes, tenant credit, independent notification requirements, irrigation history/source, crop/field binding, unsupported/manual state, malformed answers, stale information, immutable inputs and optional-area validation. Existing reference-dashboard tests cover exact-money scenario arithmetic and sourced general resources. Browser checks and final npm run check evidence are recorded in CORE_STATUS.md. Do not extend those results to physical devices, actual scheme enrolment, expert approval or model accuracy.

Next catalogue work: verified current Sehore notifications/windows, authoritative district/component rules and wider horticulture/livestock/electricity/procurement coverage. Keep the cumulative core assignment open.
