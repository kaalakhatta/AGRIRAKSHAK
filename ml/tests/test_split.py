import unittest

from agrirakshak_ml.split import assign_splits


class SplitTests(unittest.TestCase):
    def setUp(self):
        self.records = []
        for label in ("potato___healthy", "potato___late_blight"):
            for index in range(10):
                self.records.append({"path": f"{label}/{index}.jpg", "label": label, "sha256": f"{label}-{index}"})
        self.records.append({"path": "potato___healthy/duplicate.jpg", "label": "potato___healthy", "sha256": "potato___healthy-0"})

    def test_split_is_deterministic(self):
        self.assertEqual(assign_splits(self.records), assign_splits(self.records))

    def test_each_class_has_all_splits(self):
        result = assign_splits(self.records)
        for label in {record["label"] for record in result}:
            self.assertEqual({"train", "val", "test"}, {record["split"] for record in result if record["label"] == label})

    def test_exact_duplicates_stay_together(self):
        result = assign_splits(self.records)
        duplicate_splits = {record["split"] for record in result if record["sha256"] == "potato___healthy-0"}
        self.assertEqual(1, len(duplicate_splits))

    def test_rejects_too_few_unique_groups(self):
        with self.assertRaisesRegex(ValueError, "at least 3"):
            assign_splits([{"path": "a/1.jpg", "label": "a", "sha256": "1"}])

    def test_rejects_identical_files_with_conflicting_labels(self):
        records = [
            {"path": "healthy/1.jpg", "label": "healthy", "sha256": "same"},
            {"path": "disease/1.jpg", "label": "disease", "sha256": "same"},
        ]
        with self.assertRaisesRegex(ValueError, "conflicting labels"):
            assign_splits(records)


if __name__ == "__main__":
    unittest.main()
