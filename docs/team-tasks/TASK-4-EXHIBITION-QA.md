# Task 4: Exhibition QA package

## Ownership

- Branch: `docs/exhibition-qa`
- Allowed path: `docs/exhibition/**`
- Do not change any other path.

## Goal

Prepare a practical testing and presentation-defence package without assuming that unfinished features already work.

## Deliverables

Create:

```text
docs/exhibition/TEST_PLAN.md
docs/exhibition/DEMO_SCRIPT.md
docs/exhibition/JUDGE_QUESTIONS.md
docs/exhibition/RISK_REGISTER.md
docs/exhibition/BUG_REPORT_TEMPLATE.md
```

## Required coverage

The test plan must cover desktop and mobile use, camera and gallery upload, invalid files, large images, poor photographs, unsupported crops, uncertain predictions, offline use, slow networks, accessibility, privacy, and responsible-use messaging.

The judge questions must cover novelty, browser inference, evaluation beyond accuracy, data leakage, field-image testing, synthetic-data limitations, preliminary-screening language, privacy, limitations, and future scope.

The risk register must include likelihood, impact, detection method, mitigation, owner placeholder, and fallback plan.

## Accuracy rules

- Mark unknown results, timings, model sizes, and accuracy numbers as `TBD`.
- Do not claim that an unimplemented feature works.
- Do not invent project results.
- Make the demo script usable as a five-minute rehearsal, with optional material clearly separated.

## Completion evidence

The pull request must identify every `TBD`, explain how the test cases were selected, and confirm that no unimplemented feature is presented as complete.
