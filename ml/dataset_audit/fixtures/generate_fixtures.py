import os
import struct
import zlib
import json
import hashlib

def make_png(width, height, r, g, b):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(height):
        raw += b'\x00' + bytes([r, g, b]) * width
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # valid_dataset
    valid_dataset_dir = os.path.join(base_dir, "valid_dataset")
    os.makedirs(os.path.join(valid_dataset_dir, "classA"), exist_ok=True)
    os.makedirs(os.path.join(valid_dataset_dir, "classB"), exist_ok=True)
    
    with open(os.path.join(valid_dataset_dir, "classA", "img1.png"), "wb") as f: f.write(make_png(4, 4, 255, 0, 0))
    with open(os.path.join(valid_dataset_dir, "classA", "img2.png"), "wb") as f: f.write(make_png(4, 4, 0, 255, 0))
    with open(os.path.join(valid_dataset_dir, "classA", "img3.png"), "wb") as f: f.write(make_png(4, 4, 0, 0, 255))
    
    img1_classB = make_png(4, 4, 255, 255, 0)
    with open(os.path.join(valid_dataset_dir, "classB", "img1.png"), "wb") as f: f.write(img1_classB)
    with open(os.path.join(valid_dataset_dir, "classB", "img2.png"), "wb") as f: f.write(make_png(4, 4, 0, 255, 255))
    with open(os.path.join(valid_dataset_dir, "classB", "img3.png"), "wb") as f: f.write(make_png(4, 4, 255, 0, 255))
    with open(os.path.join(valid_dataset_dir, "classB", "img4.png"), "wb") as f: f.write(img1_classB) # Duplicate
    
    with open(os.path.join(valid_dataset_dir, "classA", "corrupt.dat"), "wb") as f: f.write(b"NOT_AN_IMAGE")
    
    valid_manifest = [
        {"id": "a1", "path": "classA/img1.png", "label": "classA", "sha256": "aaa111", "split": "train", "source": "synthetic", "synthetic": True},
        {"id": "a2", "path": "classA/img2.png", "label": "classA", "sha256": "aaa222", "split": "train", "source": "synthetic", "synthetic": True},
        {"id": "a3", "path": "classA/img3.png", "label": "classA", "sha256": "aaa333", "split": "val", "source": "synthetic", "synthetic": False},
        {"id": "b1", "path": "classB/img1.png", "label": "classB", "sha256": "bbb111", "split": "train", "source": "synthetic", "synthetic": True},
        {"id": "b2", "path": "classB/img2.png", "label": "classB", "sha256": "bbb222", "split": "val", "source": "synthetic", "synthetic": False},
        {"id": "b3", "path": "classB/img3.png", "label": "classB", "sha256": "bbb333", "split": "test", "source": "synthetic", "synthetic": False}
    ]
    
    for record in valid_manifest:
        record["split"] = "train"
        record["synthetic"] = True
        record["sha256"] = hashlib.sha256(open(os.path.join(valid_dataset_dir, record["path"]), "rb").read()).hexdigest()
        record["leaf_id"] = "synthetic-" + record["id"]

    with open(os.path.join(base_dir, "valid_manifest.jsonl"), "w") as f:
        for r in valid_manifest:
            f.write(json.dumps(r) + "\n")
            
    invalid_manifest = [
        {"id": "x1", "path": "classA/img1.png", "label": "classA", "sha256": "1111111111111111111111111111111111111111111111111111111111111111", "split": "train", "source": "synthetic", "synthetic": False},
        {"id": "", "path": "classA/img2.png", "label": "classA", "sha256": "2222222222222222222222222222222222222222222222222222222222222222", "split": "train", "source": "synthetic", "synthetic": False},
        {"id": "x3", "path": "classA/img3.png", "label": "classA", "sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "split": "train", "source": "synthetic", "synthetic": False},
        {"id": "x4", "path": "classB/img1.png", "label": "classB", "sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "split": "test", "source": "synthetic", "synthetic": False},
        {"id": "x5", "path": "classB/img2.png", "label": "classB", "sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "split": "val", "source": "synthetic", "synthetic": True},
        {"id": "x6", "path": "classC/img1.png", "sha256": "6666666666666666666666666666666666666666666666666666666666666666", "split": "test", "source": "synthetic", "synthetic": True}
    ]
    
    with open(os.path.join(base_dir, "invalid_manifest.jsonl"), "w") as f:
        for r in invalid_manifest:
            f.write(json.dumps(r) + "\n")

if __name__ == "__main__":
    main()
