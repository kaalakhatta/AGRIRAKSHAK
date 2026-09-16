import unittest

from agrirakshak_ml.metrics import classification_report, select_confidence_threshold


class MetricsTests(unittest.TestCase):
    def test_classification_report(self):
        report = classification_report([0, 0, 1, 1], [0, 1, 1, 1], ["healthy", "disease"])
        self.assertAlmostEqual(0.75, report["accuracy"])
        self.assertEqual([[1, 1], [0, 2]], report["confusion_matrix"])

    def test_threshold_prefers_maximum_coverage_at_target_precision(self):
        result = select_confidence_threshold([0.95, 0.90, 0.70, 0.40], [True, True, False, False], 0.85)
        self.assertEqual(0.9, result["threshold"])
        self.assertEqual(0.5, result["coverage"])

    def test_threshold_rejects_all_when_target_unreachable(self):
        result = select_confidence_threshold([0.8, 0.7], [False, False], 0.85)
        self.assertEqual(1.0, result["threshold"])
        self.assertEqual(0.0, result["coverage"])


if __name__ == "__main__":
    unittest.main()
