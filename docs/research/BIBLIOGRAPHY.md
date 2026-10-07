# Bibliography

Task 2 — Literature review (AgriRakshak)
Contributor: Yashi
Branch: `docs/literature-review`

All sixteen sources below were opened and checked before citation. Numbers correspond
to the citations in [LITERATURE_REVIEW.md](LITERATURE_REVIEW.md) and the source column
of [CLAIMS_REGISTER.md](CLAIMS_REGISTER.md). Bibliographic details are recorded only
where verified from the source itself; missing details are marked rather than inferred.

Verification-limitation markers used below:

- **[G]** Canonical `tensorflow.org` page unreachable; official GitHub documentation used.
- **[W]** Live publisher page blocked/inaccessible; Wayback Machine copy used.
- **[A]** Verified at abstract level only (full text paywalled).
- **[†]** Known wording ambiguity in the source (see note on entry 7).

---

## Peer-reviewed journal articles

**[1]** Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016). Using Deep Learning for
Image-Based Plant Disease Detection. *Frontiers in Plant Science*, *7*, 1419.
DOI: `10.3389/fpls.2016.01419`

- Verified content: PlantVillage-style dataset of 54,306 images and 38 classes; best
  held-out accuracy 99.35%; external verified datasets at 31.40% and 31.69% top-1
  accuracy.
- Verification note: 99.35% is same-dataset held-out accuracy and must not be presented
  as field performance.

**[2]** Hughes, D. P., & Salathé, M. (2015). An open access repository of images on
plant health to enable the development of mobile disease diagnostics.
arXiv:1511.08060.
URL: https://arxiv.org/abs/1511.08060

- Verified content: repository of over 50,000 expertly curated plant-health images.
- Publication venue beyond the arXiv identifier was not verified from the source and is
  therefore not stated.

**[4]** Noyan, S. (2022). Uncovering bias in the PlantVillage dataset.
arXiv:2206.04374.
DOI: `10.48550/arXiv.2206.04374`
URL: https://arxiv.org/abs/2206.04374

- Verified content: a classifier achieved 49.0% accuracy from only 8 background pixels,
  demonstrating strong background bias in the dataset.

**[8]** Ahmad, T., El Gamal, M., & Saraswat, D. (2023). Toward Generalization of Deep
Learning-Based Plant Disease Identification Under Controlled and Field Conditions.
*IEEE Access*, *11*, 9042–9057.
DOI: `10.1109/ACCESS.2023.3240100` **[W]**

- Verified content: highest reported generalization accuracy 81.60%; PlantVillage
  combined with field images 77.50–80.33%.
- Verification limitation: the IEEE Xplore live page was inaccessible during
  verification; a Wayback capture was used.

**[9]** Ramcharan, A., Alopena, P., et al. (2017). Deep Learning for Image-Based
Cassava Disease Detection. *Frontiers in Plant Science*, *8*, 1852.
DOI: `10.3389/fpls.2017.01852`

- Verified content: best model reached 93% overall accuracy on held-out data, with high
  per-class accuracies.
- Scope note: crop-specific (cassava) supporting evidence; not to be generalized
  universally. Full author list beyond the first two authors was not transcribed from
  the source and is abbreviated with "et al." rather than reconstructed.

**[10]** Ramcharan, A., et al. (2019). A Mobile-Based Deep Learning Model for Cassava
Disease Diagnosis. *Frontiers in Plant Science*, *10*, 272.
DOI: `10.3389/fpls.2019.00272`

- Verified content: performance dropped in real-world mobile video; F1 decreased by 32%
  for pronounced symptoms, mainly because of recall loss.
- Full author list beyond the first author was not transcribed from the source and is
  abbreviated with "et al." rather than reconstructed.

**[11]** Johnson, J. M., & Khoshgoftaar, T. M. (2019). Survey on deep learning with
class imbalance. *Journal of Big Data*, *6*, 27.
DOI: `10.1186/s40537-019-0192-5` **[W]**

- Verified content: class imbalance can make accuracy misleading; the review covers
  methods for handling imbalance.
- Verification limitation: the Springer live page was blocked during verification; a
  Wayback copy was used.

**[12]** Chicco, D., & Jurman, G. (2020). The advantages of the Matthews correlation
coefficient (MCC) over F1 score and accuracy in binary classification evaluation.
*BMC Genomics*, *21*, 6.
DOI: `10.1186/s12864-019-6413-7`

- Verified content: MCC can be more informative than accuracy and F1 for **binary**
  classification evaluation.
- Scope note: the verified claim is explicitly binary; do not overgeneralize to
  multiclass settings without separate evidence.

**[13]** Shorten, C., & Khoshgoftaar, T. M. (2019). A survey on Image Data Augmentation
for Deep Learning. *Journal of Big Data*, *6*, 60.
DOI: `10.1186/s40537-019-0197-0` **[W]**

- Verified content: taxonomy of geometric, colour, mixing, random erasing,
  feature-space, adversarial/GAN, style-transfer and other augmentation approaches.
- Verification limitation: the Springer live page was blocked during verification; a
  Wayback copy was used.
- Identifier caution: DOI `10.1186/s40537-019-0177-4` belongs to a **different** paper
  and must not be used for this reference.

**[14]** Bi, J., & Hu, M. (2020). Improving Image-Based Plant Disease Classification
With Generative Adversarial Network Under Limited Training Set. *Frontiers in Plant
Science*, *11*, 583438.
DOI: `10.3389/fpls.2020.583438`

- Verified content: WGAN-GP plus label smoothing improved this experiment's accuracy
  from 60.40% (CNN-only) to 84.78%; 4.2 percentage points over classic augmentation and
  2.3 points over WGAN-GP without label smoothing.
- Scope note: experiment-specific results, not universal expectations.

**[15]** Tzachor, A., et al. (2022). Responsible artificial intelligence in agriculture
requires systemic understanding of risks and externalities. *Nature Machine
Intelligence*, *4*, 104–109.
DOI: `10.1038/s42256-022-00440-4` **[A]**

- Verified content (abstract level): agricultural AI carries systemic risks involving
  data reliability/relevance, socio-ecological effects, safety/security and deployment
  at scale.
- Verification limitation: only the abstract was accessible (full text paywalled); all
  claims are held at abstract level. Full author list beyond the first author was not
  transcribed and is abbreviated rather than reconstructed.

**[16]** Jobin, A., Ienca, M., & Vayena, E. (2019). The global landscape of AI ethics
guidelines. *Nature Machine Intelligence*, *1*, 389–399.
DOI: `10.1038/s42256-019-0088-2` **[A]**

- Verified content (abstract level): common AI ethics principles include
  transparency, justice/fairness, non-maleficence, responsibility and privacy.
- Verification limitation: only the abstract was accessible (full text paywalled); all
  claims are held at abstract level.

---

## Peer-reviewed conference paper

**[7]** Singh, D., Jain, N., Jain, P., Kayal, P., Kumawat, S., & Batra, N. (2019/2020).
PlantDoc: A Dataset for Visual Plant Disease Detection. *CoDS-COMAD 2020*.
DOI: `10.1145/3371158.3371196`; arXiv:1911.10317 **[†]**

- Verified content: 2,598 images, 13 species, 27 classes; real-world benchmark evidence
  showing a substantial gap between PlantVillage-trained and field-oriented data.
- **Wording ambiguity flagged:** the source has an abstract/body wording inconsistency
  around the phrase "31%". This figure is not used as a definitive accuracy result
  anywhere in our documents; treat any PlantDoc percentage as unresolved until checked
  against the published paper directly.
- Venue year is given as the brief records it (CoDS-COMAD 2020 with a 2019 arXiv
  preprint); exact conference dates were not independently verified.

---

## Preprints and official documentation

**[3]** TensorFlow Datasets contributors. PlantVillage dataset documentation
(*TensorFlow Datasets* official catalog documentation). **[G]**

Stable source used:
https://raw.githubusercontent.com/tensorflow/datasets/master/docs/catalog/plant_village.md

- Verified content: 54,303 images and 38 classes; labels from Mohanty et al. [1].
- Verification limitation: the canonical `tensorflow.org` page for this documentation
  was unreachable during verification, so the official documentation in the TensorFlow
  Datasets GitHub repository was used. Entry has no DOI; no date was recorded from the
  source.

**[5]** Howard, A. G., et al. (2017). MobileNets: Efficient Convolutional Neural
Networks for Mobile Vision Applications. arXiv:1704.04861.
URL: https://arxiv.org/abs/1704.04861

- Verified content: depthwise-separable convolutions and width/multiplier controls
  designed for mobile and edge efficiency.
- Full author list beyond the first author was not transcribed from the source and is
  abbreviated rather than reconstructed. Later published-version details were not
  verified; only the arXiv identifier is cited.

**[6]** Tan, M., & Le, Q. V. (2019). EfficientNet: Rethinking Model Scaling for
Convolutional Neural Networks. *ICML 2019*; arXiv:1905.11946.
URL: https://arxiv.org/abs/1905.11946

- Verified content: compound scaling of depth/width/resolution; EfficientNet-B7 reached
  84.3% ImageNet top-1 accuracy while substantially smaller than the prior best.
- Scope note: cited as architecture context only; not evidence of plant-disease
  performance. No DOI was provided by the source for this citation, so none is listed.

---

## Summary of verification limitations

| Source | Limitation |
| --- | --- |
| [3] PlantVillage (TFDS docs) | Canonical `tensorflow.org` page timed out; official GitHub documentation used **[G]** |
| [7] PlantDoc | Abstract/body wording inconsistency around "31%"; figure not used **[†]** |
| [8] Ahmad et al. 2023 | IEEE Xplore live page inaccessible; Wayback capture used **[W]** |
| [11] Johnson & Khoshgoftaar 2019 | Springer live page blocked; Wayback copy used **[W]** |
| [13] Shorten & Khoshgoftaar 2019 | Springer live page blocked; Wayback copy used **[W]** |
| [15] Tzachor et al. 2022 | Abstract only (paywalled); claims held at abstract level **[A]** |
| [16] Jobin et al. 2019 | Abstract only (paywalled); claims held at abstract level **[A]** |
