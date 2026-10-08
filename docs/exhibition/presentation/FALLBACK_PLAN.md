# Fallback Plan

## Internet Failure
- Keep the local launcher running.
- Farm screens and the installed local model do not need external APIs.
- Weather data will be visibly missing; do not invent forecasts.

## Model or Photo Failure
- Display honest "unavailable" or "unsupported" state.
- If necessary, select "Run labelled interface demo".
- Explicitly introduce this to judges as an interface simulation.
- Simulated labels/confidence are not evaluated accuracy evidence.

## Backup Export Failure
- Do not claim file delivery passed if blocked by in-app browsers.
- Use the prepared JSON link in a standard browser (e.g., Chrome/Safari).
- Never delete records as a fallback. Use saved backup with conflict resolution.
