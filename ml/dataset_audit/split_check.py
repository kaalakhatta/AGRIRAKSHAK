import json
import sys

def check_split_leakage(manifest_path):
    findings = {
        "errors": [],
        "warnings": []
    }
    
    records = []
    has_errors = False
    
    with open(manifest_path, "r") as f:
        for i, line in enumerate(f):
            try:
                record = json.loads(line)
                records.append((i, record))
            except json.JSONDecodeError:
                findings["errors"].append(f"Line {i+1}: Invalid JSON")
                has_errors = True
                
    sha256_to_labels = {}
    sha256_to_splits = {}
    leaf_id_to_splits = {}
    
    required_fields = ["id", "sha256", "label", "split"]
    
    for line_num, record in records:
        missing_fields = [f for f in required_fields if not record.get(f)]
        if missing_fields:
            # Mask sensitive info if we ever included it, but we just report the line/id
            rid = record.get("id", f"line_{line_num}")
            findings["errors"].append(f"Record {rid}: Missing required fields: {', '.join(missing_fields)}")
            has_errors = True
            
        sha = record.get("sha256")
        label = record.get("label")
        split = record.get("split")
        leaf_id = record.get("leaf_id")
        synthetic = record.get("synthetic")
        
        rid = record.get("id", f"line_{line_num}")
        
        if split in ["val", "test"] and synthetic:
            findings["errors"].append(f"Record {rid}: Synthetic record found in {split} split")
            has_errors = True
            
        if not leaf_id:
            findings["warnings"].append(f"Record {rid}: Missing leaf ID, grouping unverified")
            
        if sha and label:
            if sha not in sha256_to_labels:
                sha256_to_labels[sha] = set()
            sha256_to_labels[sha].add(label)
            
        if sha and split:
            if sha not in sha256_to_splits:
                sha256_to_splits[sha] = set()
            sha256_to_splits[sha].add(split)
            
        if leaf_id and split:
            if leaf_id not in leaf_id_to_splits:
                leaf_id_to_splits[leaf_id] = set()
            leaf_id_to_splits[leaf_id].add(split)
            
    for sha, labels in sha256_to_labels.items():
        if len(labels) > 1:
            findings["errors"].append(f"Hash {sha}: Conflicting labels {sorted(list(labels))}")
            has_errors = True
            
    for sha, splits in sha256_to_splits.items():
        if len(splits) > 1:
            findings["errors"].append(f"Hash {sha}: Leakage across splits {sorted(list(splits))}")
            has_errors = True
            
    for leaf, splits in leaf_id_to_splits.items():
        if len(splits) > 1:
            findings["errors"].append(f"Leaf {leaf}: Leakage across splits {sorted(list(splits))}")
            has_errors = True
            
    findings["errors"].sort()
    findings["warnings"].sort()
    
    return findings, has_errors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python split_check.py <manifest.jsonl>")
        sys.exit(1)
        
    findings, has_errors = check_split_leakage(sys.argv[1])
    print(json.dumps(findings, indent=2))
    
    if has_errors:
        sys.exit(1)
