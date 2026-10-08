# Honest Answers for Judges

**Q: Does this diagnose crop diseases with perfect accuracy?**
A: No. The confidence score is a preliminary estimate, not a professional diagnosis. The local bundle passes synthetic transport checks, but target-crop validation needs independent field audit.

**Q: Where is the farmer's data stored?**
A: All farm records and calendar data run locally on the device (IndexedDB). No personal data or precise locations are uploaded without explicit consent.

**Q: How do you calculate yield and profit gains?**
A: We do not calculate or claim causal yield/profit gains. The season review merely shows receipts minus recorded outlays based on manual user inputs.

**Q: What happens if there's no internet?**
A: Core software works locally. The frontend is cached via a service worker, and the inference API runs locally. Weather estimates will be unavailable, but the app does not invent forecasts.

**Q: Are you prescribing fertilizers or pesticides?**
A: No. We do not prescribe treatments, concentrations, or dosages. Agronomy reviewer inputs remain TBD.
