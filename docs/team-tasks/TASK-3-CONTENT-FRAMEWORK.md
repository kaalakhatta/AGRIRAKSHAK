# Task 3: Disease-content framework

## Ownership

- Branch: `content/disease-framework`
- Allowed path: `data/catalog/**`
- Do not change any other path.

## Goal

Create a machine-readable structure and writing guide for crop and disease education content. The final supported crops do not need to be selected yet.

## Deliverables

Create or update:

```text
data/catalog/schema.json
data/catalog/quiz.schema.json
data/catalog/CONTENT_GUIDE.md
data/catalog/examples/
```

The disease schema must support a stable ID, crop, common name, verified scientific name, summary, visible symptoms, commonly confused conditions, prevention guidance, expert-referral guidance, sources, reviewer status, supported languages, and linked quiz IDs.

It must also represent:

- a healthy crop class
- an unsupported crop or condition
- an uncertain prediction
- content in draft, reviewed, and rejected states

## Safety rules

- All examples must be explicitly marked `draft`.
- Do not state that a faculty member or agriculture expert reviewed content.
- Do not include pesticide brands, chemical concentrations, or dosages.
- Do not invent agricultural facts merely to make an example look complete.
- Placeholder text must be visibly labelled as placeholder text.

## Validation

Provide a simple documented way to validate every example against the JSON schemas using a free tool or a small script inside the allowed directory.

## Completion evidence

The pull request must include validation output, explain major schema decisions, and confirm that all examples validate.
