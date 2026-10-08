import unittest
import os
from ml.dataset_audit.audit import audit_dataset

class TestDatasetAudit(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.fixtures_dir = os.path.join(self.base_dir, "fixtures", "valid_dataset")
        
    def test_audit_dataset(self):
        report = audit_dataset(self.fixtures_dir)
        
        self.assertEqual(report["summary"]["total_classes"], 2)
        self.assertEqual(report["summary"]["total_images"], 7)
        self.assertEqual(report["summary"]["corrupt_or_unsupported"], 1)
        self.assertEqual(report["summary"]["exact_duplicates"], 1)
        
        # classA has 3 valid images
        self.assertEqual(report["classes"]["classA"]["total_images"], 3)
        # classB has 4 valid images (including the duplicate)
        self.assertEqual(report["classes"]["classB"]["total_images"], 4)
        
        self.assertAlmostEqual(report["summary"]["class_imbalance_ratio"], 0.75)
        
        self.assertEqual(len(report["corrupt_files"]), 1)
        self.assertTrue(report["corrupt_files"][0].endswith("corrupt.dat"))
        
    def test_missing_dataset(self):
        with self.assertRaises(ValueError):
            audit_dataset("nonexistent_path_123")

if __name__ == "__main__":
    unittest.main()
