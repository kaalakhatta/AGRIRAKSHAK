import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from ml.dataset_audit.audit import audit_dataset
from ml.dataset_audit.split_check import check_split_leakage


class ReviewRegressions(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def manifest(self, rows):
        path = self.root / "manifest.jsonl"
        path.write_text("".join(json.dumps(row) + "\n" for row in rows))
        return check_split_leakage(path)

    def row(self, **changes):
        record = dict(id="synthetic-id", sha256="a"*64, label="classA", split="train", synthetic=True, source="synthetic", leaf_id="synthetic-leaf")
        return dict(record, **changes)

    def test_empty_class_has_no_success(self):
        (self.root / "classA").mkdir()
        with self.assertRaises(ValueError):
            audit_dataset(self.root)

    def test_empty_manifest_is_unavailable(self):
        self.assertTrue(self.manifest([])[1])

    def test_scalar_and_wrong_field_types_are_findings(self):
        for row in [[], self.row(id=[]), self.row(leaf_id=[]), self.row(synthetic="false")]:
            with self.subTest(row=row):
                self.assertTrue(self.manifest([row])[1])

    def test_split_and_hash_validation(self):
        for row in [self.row(split="unknown"), self.row(sha256="abc")]:
            self.assertTrue(self.manifest([row])[1])

    def test_synthetic_evaluation_never_passes(self):
        for split in ["val", "validation", "test"]:
            for flag in [True, False]:
                self.assertTrue(self.manifest([self.row(split=split, synthetic=flag)])[1])

    def test_duplicate_ids_and_leaf_leakage(self):
        self.assertTrue(self.manifest([self.row(), self.row(sha256="b"*64)])[1])
        rows = [self.row(source="consented-fixture-policy", synthetic=False), self.row(id="second", sha256="b"*64, split="test", source="consented-fixture-policy", synthetic=False)]
        findings, invalid = self.manifest(rows)
        self.assertTrue(invalid)
        self.assertTrue(any("Leaf group" in error for error in findings["errors"]))

    def test_output_inside_input_is_rejected_before_writing(self):
        source = self.root / "source"
        (source / "classA").mkdir(parents=True)
        image = source / "classA" / "private-file.dat"
        image.write_bytes(b"not-an-image")
        before = hashlib.sha256(image.read_bytes()).hexdigest()
        result = subprocess.run([sys.executable, "-m", "ml.dataset_audit", "--input", str(source), "--output", str(source / "report")], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((source / "report").exists())
        self.assertEqual(before, hashlib.sha256(image.read_bytes()).hexdigest())

    def test_cli_corrupt_fixture_is_failed_and_input_unchanged(self):
        source = Path(__file__).resolve().parents[1] / "fixtures" / "valid_dataset"
        before = {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in source.rglob("*") if p.is_file()}
        result = subprocess.run([sys.executable, "-m", "ml.dataset_audit", "--input", str(source), "--output", str(self.root / "report")], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((self.root / "report" / "report.json").exists())
        self.assertEqual(before, {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in before})
