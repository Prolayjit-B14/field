"""
Grouped Dataset Split Generator
Enforces 70% Train / 15% Validation / 15% Test split with session and field group isolation.
"""

import sys
import json
import random
import logging
from pathlib import Path
from collections import defaultdict

# Ensure project root is in sys.path
CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import DATASETS_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SplitGenerator")

def generate_grouped_splits(manifest_file=None, 
                            output_dir=None, 
                            train_ratio=0.70, 
                            val_ratio=0.15, 
                            test_ratio=0.15, 
                            seed=42):
    """
    Generates isolated train/val/test splits based on group keys (field/capture session)
    to prevent data leakage.
    """
    random.seed(seed)
    output_path = Path(output_dir) if output_dir else (DATASETS_DIR / "splits")
    output_path.mkdir(parents=True, exist_ok=True)

    # In production, image filenames encode group ID, e.g. "fieldA_rice_001_session2.jpg"
    # Fallback to directory/prefix grouping
    groups = defaultdict(list)
    raw_path = DATASETS_DIR / "raw"
    
    all_images = []
    supported_exts = {".jpg", ".jpeg", ".png", ".webp"}
    
    if raw_path.exists():
        for p in raw_path.rglob("*"):
            if p.suffix.lower() in supported_exts:
                all_images.append(p)
                # Extract group prefix (e.g. parent folder or prefix before underscore)
                parts = p.stem.split("_")
                group_id = parts[0] if len(parts) > 1 else p.parent.name
                groups[group_id].append(str(p.resolve()))

    group_keys = list(groups.keys())
    random.shuffle(group_keys)

    total_images = len(all_images)
    if total_images == 0:
        logger.warning("No raw images found in %s yet. Generating template splits.", raw_path)
        group_keys = [f"field_{i:02d}" for i in range(20)]
        for k in group_keys:
            groups[k] = [f"sample_{k}_{idx:03d}.jpg" for idx in range(10)]
        total_images = 200

    train_target = int(total_images * train_ratio)
    val_target = int(total_images * val_ratio)

    train_files = []
    val_files = []
    test_files = []

    for k in group_keys:
        items = groups[k]
        if len(train_files) + len(items) <= train_target or (len(train_files) < train_target and len(val_files) >= val_target):
            train_files.extend(items)
        elif len(val_files) + len(items) <= val_target or len(val_files) < val_target:
            val_files.extend(items)
        else:
            test_files.extend(items)

    # Write split files
    for name, flist in [("train", train_files), ("val", val_files), ("test", test_files)]:
        split_file = output_path / f"{name}.txt"
        with open(split_file, "w") as f:
            f.write("\n".join(flist) + "\n")
        logger.info("Generated %s split with %d samples (%.1f%%)", name, len(flist), (len(flist)/total_images)*100)

    summary = {
        "train_count": len(train_files),
        "val_count": len(val_files),
        "test_count": len(test_files),
        "total": total_images,
        "grouped_by": "session_or_folder_prefix",
        "random_seed": seed
    }
    with open(output_path / "splits_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    return summary

if __name__ == "__main__":
    generate_grouped_splits()
