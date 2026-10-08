import os
import hashlib
from collections import defaultdict
from PIL import Image

def get_sha256(filepath):
    hash_sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def audit_dataset(input_dir):
    if not os.path.isdir(input_dir):
        raise ValueError("Input directory does not exist")
    
    classes = [d for d in sorted(os.listdir(input_dir)) if os.path.isdir(os.path.join(input_dir, d))]
    if not classes:
        raise ValueError("Empty dataset or no class folders found")
    
    report = {
        "summary": {
            "total_classes": len(classes),
            "total_images": 0,
            "corrupt_or_unsupported": 0,
            "exact_duplicates": 0,
            "class_imbalance_ratio": 0.0
        },
        "classes": {},
        "duplicates": [],
        "corrupt_files": []
    }
    
    hash_map = defaultdict(list)
    class_counts = {}
    
    for cls in classes:
        cls_dir = os.path.join(input_dir, cls)
        files = [f for f in sorted(os.listdir(cls_dir)) if os.path.isfile(os.path.join(cls_dir, f))]
        
        report["classes"][cls] = {
            "total_images": 0,
            "formats": defaultdict(int),
            "dimensions": defaultdict(int)
        }
        
        valid_images = 0
        
        for file in files:
            filepath = os.path.join(cls_dir, file)
            
            try:
                with Image.open(filepath) as img:
                    img.verify()  # verify that it is, in fact, an image
                with Image.open(filepath) as img:
                    width, height = img.size
                    fmt = img.format
                
                valid_images += 1
                report["classes"][cls]["formats"][fmt] += 1
                report["classes"][cls]["dimensions"][f"{width}x{height}"] += 1
                
                # Check duplicates
                file_hash = get_sha256(filepath)
                hash_map[file_hash].append(filepath)
                
            except Exception:
                report["summary"]["corrupt_or_unsupported"] += 1
                report["corrupt_files"].append(filepath)
                
        class_counts[cls] = valid_images
        report["classes"][cls]["total_images"] = valid_images
        report["summary"]["total_images"] += valid_images
        
    if report["summary"]["total_images"] == 0:
        raise ValueError("No valid images found")
        
    min_class_count = min(class_counts.values())
    max_class_count = max(class_counts.values())
    
    if max_class_count > 0 and min_class_count > 0:
        report["summary"]["class_imbalance_ratio"] = min_class_count / max_class_count
    
    for file_hash, paths in hash_map.items():
        if len(paths) > 1:
            report["summary"]["exact_duplicates"] += (len(paths) - 1)
            report["duplicates"].append({"hash": file_hash, "paths": paths})
            
    # Convert defaultdicts to regular dicts for JSON serialization
    for cls in report["classes"]:
        report["classes"][cls]["formats"] = dict(report["classes"][cls]["formats"])
        report["classes"][cls]["dimensions"] = dict(report["classes"][cls]["dimensions"])
            
    return report
