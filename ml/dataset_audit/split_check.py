import json
import re
import sys


def check_split_leakage(manifest_path):
    """Validate JSONL records; fixture findings are not evaluation evidence."""
    findings = {"errors": [], "warnings": []}
    records = []
    with open(manifest_path, encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                findings["errors"].append(f"Line {number}: Invalid JSON")
                continue
            if not isinstance(record, dict):
                findings["errors"].append(f"Line {number}: Record must be a JSON object")
                continue
            records.append((number, record))
    if not records:
        findings["errors"].append("Manifest has no usable records; data unavailable")
    hashes_to_labels, hashes_to_splits, leaves_to_splits = {}, {}, {}
    seen_ids = set()
    for number, record in records:
        reference = f"Line {number}"  # Never echo user paths/IDs in shared findings.
        invalid = [field for field in ("id", "sha256", "label", "split")
                   if not isinstance(record.get(field), str) or not record[field].strip()]
        if invalid:
            findings["errors"].append(f"{reference}: Missing required fields or invalid types: {', '.join(invalid)}")
            continue
        identifier, sha, label, split = (record[field] for field in ("id", "sha256", "label", "split"))
        if identifier in seen_ids:
            findings["errors"].append(f"{reference}: Duplicate record ID")
        seen_ids.add(identifier)
        if not re.fullmatch(r"[0-9a-fA-F]{64}", sha):
            findings["errors"].append(f"{reference}: SHA-256 must contain 64 hexadecimal characters")
            continue
        sha = sha.lower()
        split = "val" if split == "validation" else split
        if split not in {"train", "val", "test"}:
            findings["errors"].append(f"{reference}: Unknown split")
            continue
        synthetic = record.get("synthetic")
        if not isinstance(synthetic, bool):
            findings["errors"].append(f"{reference}: Synthetic flag must be explicitly boolean")
        source_synthetic = record.get("source") == "synthetic"
        if source_synthetic and synthetic is not True:
            findings["errors"].append(f"{reference}: Synthetic source conflicts with synthetic flag")
        if split in {"val", "test"} and (synthetic is True or source_synthetic):
            findings["errors"].append(f"{reference}: Synthetic record found in {split} split")
        leaf = record.get("leaf_id")
        if leaf is None or leaf == "":
            findings["warnings"].append(f"{reference}: Missing leaf ID, grouping unverified")
        elif not isinstance(leaf, str):
            findings["errors"].append(f"{reference}: Leaf ID must be a string")
        else:
            leaves_to_splits.setdefault(leaf, set()).add(split)
        hashes_to_labels.setdefault(sha, set()).add(label)
        hashes_to_splits.setdefault(sha, set()).add(split)
    for labels in hashes_to_labels.values():
        if len(labels) > 1:
            findings["errors"].append("Exact duplicate group: Conflicting labels")
    for splits in hashes_to_splits.values():
        if len(splits) > 1:
            findings["errors"].append("Exact duplicate group: Leakage across splits")
    for splits in leaves_to_splits.values():
        if len(splits) > 1:
            findings["errors"].append("Leaf group: Leakage across splits")
    findings["errors"].sort()
    findings["warnings"].sort()
    return findings, bool(findings["errors"])


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m dataset_audit.split_check <manifest.jsonl>", file=sys.stderr)
        return 1
    try:
        findings, invalid = check_split_leakage(sys.argv[1])
    except OSError:
        findings, invalid = {"errors": ["Manifest unavailable or unreadable"], "warnings": []}, True
    print(json.dumps(findings, indent=2))
    return int(invalid)


if __name__ == "__main__":
    sys.exit(main())
