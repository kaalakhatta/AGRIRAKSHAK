import unittest

from agrirakshak_ml.prepare_plantvillage import (
    UNSUPPORTED_LABEL,
    target_label,
    validation_leaf_ids,
)


class PreparePlantVillageTests(unittest.TestCase):
    def test_supported_crop_keeps_original_label(self):
        label = "Tomato___Late_blight"
        self.assertEqual(target_label(label, include_unsupported=True), label)
        pepper = "Pepper,_bell___Bacterial_spot"
        self.assertEqual(target_label(pepper, include_unsupported=True), pepper)

    def test_other_crop_can_become_unsupported(self):
        self.assertEqual(
            target_label("Apple___healthy", include_unsupported=True), UNSUPPORTED_LABEL
        )
        self.assertIsNone(target_label("Apple___healthy", include_unsupported=False))

    def test_validation_split_keeps_leaf_groups_together(self):
        records = [
            {"target_label": "Tomato___healthy", "leaf_id": f"leaf-{index // 2}"}
            for index in range(20)
        ]
        selected = validation_leaf_ids(records, seed=130, ratio=0.2)
        self.assertEqual(len(selected), 2)
        for leaf_id in selected:
            self.assertEqual(sum(record["leaf_id"] == leaf_id for record in records), 2)


if __name__ == "__main__":
    unittest.main()
