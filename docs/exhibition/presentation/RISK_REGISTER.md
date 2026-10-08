# Risk Register

| Risk | Likelihood | Impact | Detection | Mitigation | Responsible | Fallback |
|------|------------|--------|-----------|------------|-------------|----------|
| Network failure | High | Low | Browser offline event | Service worker caching | Arindam | Keep local launcher running; weather stays unavailable. |
| Model loading fails | Medium | Medium | 503 from /health/ready | Graceful unavailable state | Arindam | Run labelled interface demo explicitly introduced as simulation. |
| In-app browser backup download block | High | Medium | Missing download event | Test in multiple webviews | Arindam | Use prepared JSON link on actual presentation browser. |
| Missing Agronomy Review | Certain | High | TBD status | Abstain from providing advice | Kaalakhatta | Explicitly state advice is unavailable. |
