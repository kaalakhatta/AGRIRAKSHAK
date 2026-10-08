# Exhibition Model-Readiness and Regression Evidence Packet

## Evidence Table

| Area | Status | Findings / Evidence |
| :--- | :--- | :--- |
| **Baseline Provenance** | BLOCKED / TBD | Awaiting run/source/model-card evidence from Yashi. |
| **Scope/Labels** | READY (Partial) | Baseline crops (`Pepper,_bell`, `Potato`, `Tomato`, `Unsupported___other_plant`) scope is defined. |
| **Metrics/Calibration** | NOT-RUN / TBD | Baseline metrics unverified. Awaiting verification from Yashi. |
| **Field/Target-Crop Gaps** | BLOCKED | Target crops (soybean/wheat/chickpea) missing. Field validation not run. |
| **Artifact Integrity** | NOT-RUN / TBD | ONNX export integrity unverified. Awaiting model artifact. |
| **Actual-Device Behavior** | BLOCKED / TBD | Awaiting observed device measurements and latency timings from Aanya. |

## Synthetic Input-Contract & Negative-Case Expectations
*Note: Synthetic transport smoke testing is for integration verification only; it is NOT accuracy or field validation.*

- **Unreadable/Corrupted Images:** The pipeline must catch image decoding failures and return a clear `invalid_image` error code rather than failing silently or returning a spurious prediction.
- **Unsupported/Off-Target Images:** For images out of the known distribution (or strictly categorized as `Unsupported___other_plant`), the model should output the unsupported class label, or the confidence should fall below the required abstention threshold, triggering an "Unknown/Unsupported" user message.

These expectations trace directly back to the missing uncertainty policy verification highlighted in the `BASELINE_AUDIT.md`.

## Defect/Gap Register & Next Actions
**Prioritized Gaps:**
1. Missing model artifact, provenance, and source-reported metrics.
2. Unverified runtime uncertainty/abstention behavior.
3. Missing observed device latencies.
4. Complete absence of target crops (soybean, wheat, chickpea).

**Judge-Safe Model Claim Wording:**
"The current model deployment is a baseline prototype for pepper, potato, and tomato, pending independent metric verification and field validation. Target crop support (soybean, wheat, chickpea) has not been integrated."

**Named Evidence Owners:**
- **Yashi:** Metrics, calibration, ONNX export verification, model-card evidence.
- **Aanya:** Actual device timings, size, and latency behavior on-device.

**Hand-off:**
Handing off these findings and the next integration steps to **Arindam**.
