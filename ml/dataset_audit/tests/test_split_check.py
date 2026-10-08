import unittest
import os
from ml.dataset_audit.split_check import check_split_leakage

class TestSplitCheck(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.valid_manifest = os.path.join(self.base_dir, "fixtures", "valid_manifest.jsonl")
        self.invalid_manifest = os.path.join(self.base_dir, "fixtures", "invalid_manifest.jsonl")

    def test_valid_manifest(self):
        findings, has_errors = check_split_leakage(self.valid_manifest)
        self.assertFalse(has_errors)
        self.assertEqual(len(findings["errors"]), 0)

    def test_invalid_manifest(self):
        data_dir = os.path.join(self.base_dir, "fixtures", "valid_dataset")
        findings, has_errors = check_split_leakage(self.invalid_manifest, data_dir=data_dir)
        self.assertTrue(has_errors)

        errors = findings["errors"]
        error_str = str(errors)

        # Missing required fields
        self.assertIn("Missing required fields", error_str)
        # Conflicting labels
        self.assertIn("Conflicting labels", error_str)
        # Leakage
        self.assertIn("Leakage across splits", error_str)
        # Synthetic in val/test
        self.assertIn("Synthetic record found", error_str)

        # New errors
        self.assertIn("Invalid JSON", error_str)
        self.assertIn("Record must be a JSON object", error_str)
        self.assertIn("Duplicate record ID", error_str)
        self.assertIn("64 hexadecimal characters", error_str)
        self.assertIn("Unknown split", error_str)
        self.assertIn("absent from data directory", error_str)

if __name__ == "__main__":
    unittest.main()
