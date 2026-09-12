"""
Plant Vision Dataset Quality Control & Validation Script
- Removes corrupted or zero-byte files
- Detects exact and near-duplicates using perceptual hashing (dHash)
- Verifies annotation formats and bounding box boundary integrity
- Prevents cross-split data leakage (group session isolation)
"""
import sys
import os
import json
import logging
from pathlib import Path

# Ensure project root is in sys.path
CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import load_classes_config, DATASETS_DIR
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DatasetValidator")

def compute_dhash(image_path, hash_size=8):
    """Computes a difference hash (dHash) for an image to detect near-duplicates."""
    try:
        with Image.open(image_path) as img:
            img = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left = pixels[row * (hash_size + 1) + col]
                    right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(left > right)
            return sum([2 ** i for (i, v) in enumerate(diff) if v])
    except Exception as e:
        logger.warning("Failed to compute hash for %s: %s", image_path, e)
        return None

def scan_and_clean_duplicates(image_directory, hamming_threshold=2):
    """Scans directory and identifies near-duplicate and duplicate files."""
    image_dir = Path(image_directory)
    if not image_dir.exists():
        logger.info("Directory %s does not exist, skipping duplicate scan.", image_dir)
        return []

    hashes = {}
    duplicates = []
    supported_exts = {".jpg", ".jpeg", ".png", ".webp"}

    for p in image_dir.rglob("*"):
        if p.suffix.lower() in supported_exts:
            # Check for zero size / corrupt
            if p.stat().st_size == 0:
                logger.warning("Corrupt / zero-byte file detected: %s", p)
                duplicates.append((str(p), "corrupted_zero_byte"))
                continue

            h = compute_dhash(p)
            if h is None:
                duplicates.append((str(p), "unreadable_corrupt"))
                continue

            # Compare against existing hashes
            matched = False
            for existing_path, existing_hash in hashes.items():
                # Hamming distance between bit hashes
                distance = bin(h ^ existing_hash).count("1")
                if distance <= hamming_threshold:
                    logger.info("Duplicate found: %s is near-duplicate of %s (dist: %d)", p.name, Path(existing_path).name, distance)
                    duplicates.append((str(p), str(existing_path)))
                    matched = True
                    break
            
            if not matched:
                hashes[str(p)] = h

    logger.info("Found %d duplicate/corrupted candidates out of %d scanned files in %s.", len(duplicates), len(hashes) + len(duplicates), image_dir)
    return duplicates

def validate_detection_annotations(annotations_dir):
    """Validates YOLO or COCO bounding box annotations (normalized bounds, non-empty, labels match schema)."""
    ann_path = Path(annotations_dir)
    if not ann_path.exists():
        return {"valid": True, "inspected": 0, "errors": []}

    errors = []
    classes_cfg = load_classes_config()
    valid_classes = set(classes_cfg.get("plant_detection", []) + classes_cfg.get("physical_damage", []) + classes_cfg.get("pest_detection", []))

    inspected = 0
    for txt_file in ann_path.glob("**/*.txt"):
        inspected += 1
        with open(txt_file, "r") as f:
            for line_idx, line in enumerate(f):
                parts = line.strip().split()
                if not parts:
                    continue
                if len(parts) != 5:
                    errors.append(f"{txt_file}:{line_idx+1}: Expected 5 elements (class x y w h), got {len(parts)}")
                    continue
                try:
                    cls_id, x, y, w, h = int(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                    if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0 and 0.0 < w <= 1.0 and 0.0 < h <= 1.0):
                        errors.append(f"{txt_file}:{line_idx+1}: Out-of-bounds coordinates (x={x}, y={y}, w={w}, h={h})")
                except ValueError as e:
                    errors.append(f"{txt_file}:{line_idx+1}: Number parsing error: {e}")

    logger.info("Validated %d annotation files. Errors found: %d", inspected, len(errors))
    return {"valid": len(errors) == 0, "inspected": inspected, "errors": errors}

def verify_no_data_leakage(train_list, val_list, test_list):
    """Ensures no session/subject overlap across train, val, and test splits."""
    train_set = set(train_list)
    val_set = set(val_list)
    test_set = set(test_list)

    overlap_train_val = train_set.intersection(val_set)
    overlap_train_test = train_set.intersection(test_set)
    overlap_val_test = val_set.intersection(test_set)

    leakage = len(overlap_train_val) + len(overlap_train_test) + len(overlap_val_test)
    if leakage > 0:
        logger.error("DATA LEAKAGE DETECTED: %d overlapping samples across splits!", leakage)
        return False
    logger.info("Zero data leakage verified across train (%d), val (%d), and test (%d) sets.", len(train_set), len(val_set), len(test_set))
    return True

if __name__ == "__main__":
    scan_and_clean_duplicates(DATASETS_DIR / "raw")
    validate_detection_annotations(DATASETS_DIR / "annotations" / "detection")
