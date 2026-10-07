# Literature review: preliminary crop-disease screening with lightweight CNNs

Task 2 — Literature review (AgriRakshak)
Contributor: Yashi
Branch: `docs/literature-review`
Allowed path: `docs/research/**`

## 1. Purpose and scope

AgriRakshak is a college exhibition project for preliminary crop-disease screening and
education. The core application runs a small ONNX image classifier in the browser and
shows reviewed educational content. This review establishes a verifiable research
foundation for the project report and the exhibition defence.

Scope of the review, as required by the task brief:

- crop-disease CNN classification
- MobileNet and/or EfficientNet
- PlantVillage limitations
- field-image generalization
- class imbalance
- conventional augmentation
- synthetic augmentation
- model calibration
- responsible use of agricultural AI

Every source cited here was opened and checked before citation. Sixteen sources were
verified; the full list with identifiers is in [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md), and
the exact project claims each source supports are recorded in
[CLAIMS_REGISTER.md](CLAIMS_REGISTER.md).

Throughout this document we separate **Reported findings** (what a source actually
states) from **Our interpretation** (what AgriRakshak concludes from those findings).
Interpretation is ours, not the sources' claim.

## 2. Deep learning for crop-disease image classification

### 2.1 Reported findings

The modern reference point for image-based plant disease detection is Mohanty, Hughes
and Salathé (2016) [1]. Using a PlantVillage-style dataset of 54,306 images covering 38
classes, their best model reached 99.35% accuracy on held-out data drawn from the same
dataset. However, when evaluated on external, independently verified datasets, top-1
accuracy fell to 31.40% and 31.69%. The authors themselves frame the work as a proof of
concept for the potential of deep learning, not as field-deployed performance.

Ramcharan, Alopena et al. (2017) [9] showed that the same family of approaches can work
well for a single crop in a narrower problem: their best model reached 93% overall
accuracy on held-out cassava disease images, with high per-class accuracies. This is
crop-specific supporting evidence, not a universal result across crops.

Singh et al. (2019/2020), PlantDoc [7], contributed a real-world benchmark of 2,598
images spanning 13 species and 27 classes, explicitly built to test models trained on
curated data against field-collected imagery. Their reported comparison shows a
substantial gap between PlantVillage-trained performance and performance on
field-oriented data. Note an ambiguity flagged during verification: the PlantDoc source
contains an abstract/body wording inconsistency around a "31%" figure, so we do not
state that number as a definitive accuracy result (see §11).

Ahmad, El Gamal and Saraswat (2023) [8] studied generalization between controlled and
field conditions directly. The highest reported generalization accuracy was 81.60%, and
combining PlantVillage with field images yielded 77.50–80.33%. These figures are
materially below the near-perfect accuracies typical of same-dataset evaluation.

### 2.2 Our interpretation

High same-dataset accuracy is achievable and reproducible, but it is an optimistic
ceiling rather than a prediction of field performance. For AgriRakshak, this means the
exhibition demonstration must never present a held-out accuracy number as evidence that
the tool works on any leaf a visitor photographs. The gap between curated and
field-collected imagery is the central technical risk of the project, and the report
should state it explicitly rather than bury it.

## 3. PlantVillage and its limitations

### 3.1 Reported findings

The dataset underlying most of these results is the open plant-health image repository
described by Hughes and Salathé (2015) [2]: over 50,000 expertly curated plant-health
images. The TensorFlow Datasets official PlantVillage documentation [3] describes the
dataset as 54,303 images across 38 classes, with labels taken from Mohanty et al. [1]
(The small difference from the 54,306 figure in [1] is reported as each source states
it; we do not speculate about the cause).

Two limitations are well documented in our verified sources:

1. **Generalization gap.** As above, external evaluation of models trained on this
   data dropped to 31.40% and 31.69% top-1 accuracy [1].
2. **Background bias.** Noyan (2022) [4] showed that a classifier achieved 49.0%
   accuracy using only 8 background pixels — pixels containing no leaf tissue at all.
   This demonstrates that the dataset carries strong background signal that models can
   exploit instead of disease symptoms.

### 3.2 Our interpretation

PlantVillage is a valuable, openly documented resource for prototyping, and it is
plausible that background and acquisition artifacts (uniform backgrounds, lab-style
framing) make same-dataset evaluation flattering. The bias result [4] is the clearest
single piece of evidence that "accuracy on PlantVillage-style data" is not a reliable
proxy for "recognises disease symptoms". For the exhibition, this is a useful and
defensible talking point: our model's errors and dataset biases are known limitations,
not hidden ones.

**Verification note:** the canonical `tensorflow.org` PlantVillage documentation page
was unreachable during verification, so the official TensorFlow Datasets documentation
on GitHub was used instead [3]. This limitation is recorded in §11 and in the
bibliography.

## 4. Field-image generalization

### 4.1 Reported findings

The field-generalization evidence is consistent across sources:

- Trained and externally tested on different verified datasets: 31.40% and 31.69%
  top-1 accuracy [1].
- PlantDoc's field-oriented benchmark reveals a substantial gap between
  PlantVillage-trained and real-world performance [7].
- Best cross-condition generalization of 81.60%; PlantVillage + field images reached
  77.50–80.33% [8].
- Ramcharan et al. (2019) [10] deployed a mobile deep learning model for cassava
  disease diagnosis and observed performance drops on real-world mobile video: F1
  decreased by 32% for pronounced symptoms, mainly because of recall loss. In other
  words, in deployment the model missed diseased cases it had handled in the lab.

### 4.2 Our interpretation

The failure mode that matters most for a screening tool is lost recall — diseased
plants classified as healthy — because that is the error that would mislead a user.
The cassava mobile-deployment result [10] shows this happens in practice, largely due to
uncontrolled capture conditions. AgriRakshak should therefore be positioned as
preliminary screening and education: it flags candidates for human attention, it does
not certify plant health. A "healthy" output should never be presented as a guarantee.

## 5. Class imbalance and evaluation metrics

### 5.1 Reported findings

Johnson and Khoshgoftaar (2019) [11] survey deep learning under class imbalance and
review methods for handling it; a key point verified from the source is that class
imbalance can make overall accuracy a misleading measure of performance. Chicco and
Jurman (2020) [12] show that the Matthews correlation coefficient (MCC) can be more
informative than accuracy and F1 score for binary classification evaluation. Their
analysis is explicitly scoped to **binary** classification.

### 5.2 Our interpretation

If some disease classes in training data are rare, a model can score well on overall
accuracy while performing poorly on exactly the classes users care about. This motivates
reporting per-class metrics rather than a single headline accuracy. When citing [12],
we must state its binary scope: MCC remains a useful metric to report, but we do not
extend the paper's comparative claim to our multiclass setting without project-specific
evidence. Which metrics AgriRakshak will report (per-class precision/recall/F1, MCC,
class-balanced summaries) is a project decision; the resulting numbers are **TBD** until
evaluation is run.

## 6. Conventional (traditional) augmentation

### 6.1 Reported findings

Shorten and Khoshgoftaar (2019) [13] survey image data augmentation for deep learning
and provide a taxonomy covering geometric transforms, colour-space transforms, mixing
samples, random erasing, feature-space augmentation, adversarial/GAN-based methods,
style transfer and other approaches.

### 6.2 Our interpretation

Conventional augmentation is a low-cost, dependency-free way to increase variation in
training data, and it is the sensible first step for a small college project. The survey
supports describing these categories accurately in the report rather than claiming that
any particular transform "solves" generalization. The quantitative benefit of any
augmentation choice for our own model is **TBD** pending experiments.

## 7. Synthetic augmentation (GAN-generated training data)

### 7.1 Reported findings

Bi and Hu (2020) [14] improved image-based plant disease classification under a limited
training set using a Wasserstein GAN with gradient penalty (WGAN-GP) plus label
smoothing. In their experiment, accuracy rose from 60.40% with a CNN-only baseline to
84.78% — 4.2 percentage points over classic augmentation and 2.3 points over WGAN-GP
without label smoothing.

### 7.2 Our interpretation

These are experiment-specific results from one study under one limited-data setting;
they are **not** a universal expectation for any GAN-based augmentation, and they must
not be presented as what AgriRakshak will achieve. The honest framing is: synthetic
augmentation is an active research direction with demonstrated potential in
limited-training-set experiments [14], while conventional augmentation [13] remains the
practical default. Whether AgriRakshak uses synthetic data at all is a scope decision;
if it does, expected gains remain **TBD**.

## 8. Lightweight CNN architectures for browser and edge deployment

### 8.1 Reported findings

Howard et al. (2017) [5] introduce MobileNets, built on depthwise-separable
convolutions with width and resolution multipliers, explicitly designed for efficient
mobile and embedded vision applications. Tan and Le (2019) [6] introduce EfficientNet's
compound scaling of depth, width and resolution; their EfficientNet-B7 reached 84.3%
ImageNet top-1 accuracy while being substantially smaller than the prior best model.

### 8.2 Our interpretation — why lightweight CNNs matter here

AgriRakshak runs an ONNX classifier **in the browser**, on a visitor's or student's own
device, with no guaranteed GPU and a small model budget for download and inference
latency. That constraint is exactly the problem MobileNet was designed for [5]: fewer
parameters and multiply-accumulates per inference mean faster load times, responsive
prediction on modest hardware, and the ability to demo at an exhibition without
specialised equipment. EfficientNet [6] provides useful architecture context — it shows
how scaling choices trade accuracy against size — but it is cited here only as
architecture background. Neither [5] nor [6] reports plant-disease performance, and we
do not use ImageNet numbers as evidence of disease-classification quality. The final
architecture choice and its measured size/latency on our target devices are project
decisions; measured results are **TBD**.

## 9. Model calibration

### 9.1 Reported findings

**None of the sixteen verified sources reports a calibration experiment.** The
literature we verified covers accuracy, generalization, bias, imbalance metrics and
augmentation, but it does not provide a specific calibration result (for example,
reliability diagrams, expected calibration error, or temperature scaling) that we could
report as demonstrated fact.

### 9.2 Our interpretation and status

Calibration is the degree to which predicted probabilities match observed frequencies —
a model that outputs 0.9 confidence should be right roughly 90% of the time on such
cases. For a screening tool this matters: an overconfident model makes a "93% healthy"
-style output look like a measurement when it is an unvalidated estimate. We therefore
treat calibration as an **evaluation and deployment consideration** for AgriRakshak:

- we will not present raw softmax outputs as trustworthy confidence percentages unless
  calibration is measured;
- calibration measurement (for example reliability diagrams or expected calibration
  error on a held-out set) is planned as a project-specific validation step.

**Status: TBD.** Project-specific calibration evidence does not yet exist; no claim
that any listed source demonstrated a calibration result may be made. This item is
tracked in [CLAIMS_REGISTER.md](CLAIMS_REGISTER.md) as claim C-14.

## 10. Responsible use of agricultural AI

### 10.1 Reported findings

Tzachor et al. (2022) [15], verified at abstract level only, argue that responsible AI
in agriculture requires systemic understanding of risks and externalities, involving
data reliability and relevance, socio-ecological effects, safety and security, and
deployment at scale. Jobin, Ienca and Vayena (2019) [16], also verified at abstract
level only, find that common AI ethics principles across global guidelines include
transparency, justice/fairness, non-maleficence, responsibility and privacy.

### 10.2 Our interpretation and project position

Both sources were verified only at abstract level (full text was paywalled), so we keep
claims at that level and do not attribute finer-grained conclusions to them. Applying
their themes to AgriRakshak yields the project's responsible-use position:

- **Preliminary screening and education only.** AgriRakshak is not a professional
  diagnosis system and does not prescribe pesticides, products, concentrations or
  dosages. (Prescription guidance is out of scope by project policy, not by evidence.)
- **Transparency.** The report and exhibition state dataset provenance, known
  limitations and uncertainty rather than presenting a single accuracy figure.
- **Non-maleficence.** Outputs are framed as candidates for human attention; users are
  directed to local agricultural experts for action.
- **Privacy.** Users' photographs are processed in the browser and are not uploaded for
  training without consent; no user photographs or personal data are committed to the
  repository.

These are our project commitments derived from the themes above, not claims that [15]
or [16] endorse AgriRakshak.

## 11. Synthesis for the AgriRakshak report and exhibition defence

1. **Headline accuracy must be qualified.** 99.35% [1] is same-dataset held-out
   accuracy; external results from the same paper were 31.40%/31.69%. Never present the
   first number without the second.
2. **Bias is documented, not hypothetical.** 49.0% accuracy from 8 background pixels
   [4] is concrete evidence that models can learn background instead of symptoms.
3. **Field conditions reduce performance.** Cross-condition generalization tops out at
   81.60% in [8], and real-world mobile deployment cost 32% F1 for pronounced cassava
   symptoms [10].
4. **Evaluation must be per-class.** Imbalance can make accuracy misleading [11]; MCC is
   supported for the binary case only [12].
5. **Augmentation claims must be scoped.** Taxonomy from [13]; quantitative gains from
   [14] are experiment-specific.
6. **Model choice is driven by deployment.** In-browser inference favours
   depthwise-separable efficiency [5]; EfficientNet [6] is architecture context only.
7. **Calibration is unevidenced so far — TBD.**
8. **Responsible use is a first-order requirement** [15], organised around familiar
   ethics principles [16], and is reflected in our screening-only scope.

## 12. Verification method

Search and verification procedure for this review:

1. **Every source was opened and checked before citation.** No source is cited on the
   basis of memory or secondary reference alone.
2. **Sixteen sources were verified** (1–16 in [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md)),
   exceeding the brief's minimum of ten. They comprise peer-reviewed journal papers, a
   peer-reviewed conference paper, arXiv preprints, and official dataset
   documentation.
3. **Stable identifiers recorded.** DOI or arXiv identifier and a stable URL are given
   wherever the source provides one; no identifiers were generated where unknown.
4. **Claim-level traceability.** Each project claim is mapped to its source in
   [CLAIMS_REGISTER.md](CLAIMS_REGISTER.md), with evidence strength and limitations.

### 12.1 Known access limitations

- **Source [3], TensorFlow Datasets PlantVillage documentation:** the canonical
  `tensorflow.org` page timed out / was unreachable during verification. The official
  TensorFlow Datasets documentation hosted on GitHub was used instead, at
  `https://raw.githubusercontent.com/tensorflow/datasets/master/docs/catalog/plant_village.md`.
  The mirror is official project documentation, but it is a mirror of the canonical
  page, and this is noted wherever [3] is cited.
- **Sources [11] and [13], Springer / *Journal of Big Data*:** live pages were blocked
  during verification; Wayback Machine copies were used.
- **Source [8], IEEE Xplore:** the live page was inaccessible during verification; a
  Wayback capture was used.
- **Sources [15] and [16], *Nature Machine Intelligence*:** only the abstracts were
  accessible (full text paywalled), so all claims attributed to them are held at
  abstract level.

### 12.2 Source-specific ambiguity

- **PlantDoc [7]:** the source contains an abstract/body wording inconsistency around
  the phrase "31%". The inconsistency was observed during verification and could not be
  resolved from the source itself. We therefore do **not** state a "31% accuracy"
  figure for PlantDoc anywhere in this report, and we describe PlantDoc's contribution
  qualitatively (a real-world benchmark showing a substantial
  PlantVillage-to-field gap) plus its verified dataset statistics (2,598 images, 13
  species, 27 classes). Anyone quoting a PlantDoc percentage must first resolve the
  ambiguity against the published paper.

### 12.3 Claims that remain unverified or TBD

| Item | Status |
| --- | --- |
| PlantDoc "31%" figure | Ambiguous in source; not used; unresolved |
| AgriRakshak model calibration results (reliability diagrams, ECE, temperature scaling) | **TBD** — no project-specific calibration evidence exists yet |
| AgriRakshak per-class and class-balanced evaluation metrics | **TBD** — pending evaluation run |
| Quantitative benefit of augmentation choices for the AgriRakshak model | **TBD** — pending experiment |
| AgriRakshak model accuracy, size and latency on target devices | **TBD** — pending measurement |
| Any pesticide/product recommendation | Out of scope by project policy; not evidenced |
| Expert or agronomist approval of AgriRakshak outputs | Not obtained; not claimed |

## 13. References

Numeric citations [1]–[16] correspond to the entries in
[BIBLIOGRAPHY.md](BIBLIOGRAPHY.md). Proposed claims and their recommended wording are
in [CLAIMS_REGISTER.md](CLAIMS_REGISTER.md).
