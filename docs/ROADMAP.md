# AgriRakshak delivery roadmap

This roadmap optimizes for a reliable college exhibition demo. Dates should be assigned after the team confirms the exhibition deadline.

## Phase 0: scope and evidence

**I will**

- maintain the backlog, repository structure, CI, and technical decisions
- define dataset manifests, evaluation scripts, and acceptance checks
- review integrations and keep the demo reproducible

**You and the team will**

- confirm the 3 target crops and 2 to 4 conditions per crop
- confirm the exhibition date, team member names, and available devices
- collect only legally usable images and record each source and license
- arrange review of remedies and prevention content by a qualified faculty or agriculture expert

**Exit check:** target classes, data licenses, reviewer, and success metrics are documented.

## Phase 1: clickable product shell

**I will** build the mobile-first upload flow, sample-image mode, result view, encyclopedia, quiz shell, PWA caching, accessibility checks, and automated tests.

**You and the team will** supply the project identity, crop names, bilingual priorities, and approved content. You will test the flow on the exact phone and laptop used at the exhibition.

**Exit check:** the complete journey works with mocked predictions and no network after the first load.

## Phase 2: baseline model

**I will** prepare reproducible PyTorch notebooks and scripts for validation, splitting, training, evaluation, ONNX export, and browser integration.

**You and the ML lead will** run training on Colab or Kaggle, preserve experiment outputs, inspect mislabeled images, and upload only approved small artifacts. Large datasets and checkpoints must stay outside Git.

**Exit check:** baseline metrics include per-class precision, recall, F1, confusion matrix, calibration, and separate performance on field photos.

## Phase 3: robustness experiment

Start with conventional augmentation and class-balanced sampling. Add synthetic generation only if the baseline shows a measurable minority-class problem.

**I will** implement the comparison protocol and result report. If synthetic data is justified, I will add a controlled experiment that keeps every synthetic image out of validation and test sets.

**You and the team will** visually review generated images, document rejected artifacts, and help explain why improvement on real test images matters more than visual realism.

**Exit check:** the team can defend the experiment without claiming that synthetic data always improves accuracy.

## Phase 4: exhibition hardening

**I will** optimize the model, add low-confidence and unsupported-image handling, prepare demo fixtures, run automated checks, and create a release checklist.

**You and the team will** rehearse the presentation, test in airplane mode, prepare printed QR codes, and keep a local backup on the demo laptop.

**Exit check:** a five-minute demo succeeds three times in a row on exhibition hardware.

## Phase 5: optional extensions

Only after the MVP is stable: Hindi or regional-language content, Grad-CAM explanations, progress tracking, expert referral links, and expanded crop coverage.

## Immediate next decisions

1. Exhibition date and judging rubric
2. Three target crops and supported conditions
3. Device used for the live demo
4. Named faculty or agriculture reviewer
5. Whether Hindi support belongs in the MVP
