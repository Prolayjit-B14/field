"""
Plant Vision Dataset Manager
Orchestrates downloading, ingestion, folder verification, and validation for
agricultural datasets (PlantDoc, PlantVillage, IP102, Paddy Doctor, and Custom Smartphone Dataset).
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

from ml.common import DATASETS_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DatasetManager")

DATASET_ROOT = DATASETS_DIR
RAW_DIR = DATASET_ROOT / "raw"
PROCESSED_DIR = DATASET_ROOT / "processed"
ANNOTATIONS_DIR = DATASET_ROOT / "annotations"
METADATA_DIR = DATASET_ROOT / "metadata"
SPLITS_DIR = DATASET_ROOT / "splits"

VERIFIED_DATASET_SOURCES = {
    "plantdoc": {
        "url": "https://github.com/pratikkayal/PlantDoc-Dataset",
        "description": "Field-condition plant disease images with real-world backgrounds.",
        "target_dir": RAW_DIR / "plant_health" / "plantdoc"
    },
    "plantvillage": {
        "url": "https://github.com/spmohanty/plantvillage-dataset",
        "description": "Standard leaf appearance and disease reference baseline.",
        "target_dir": RAW_DIR / "plant_health" / "plantvillage"
    },
    "ip102": {
        "url": "https://github.com/xpwu95/IP102",
        "description": "Large-scale benchmark dataset for insect pest recognition.",
        "target_dir": RAW_DIR / "pest" / "ip102"
    },
    "paddy_doctor": {
        "url": "https://github.com/PawarMukesh/RiceLeaf-Disease-Detector",
        "description": "Field-collected rice leaf datasets for rice-specific characteristics.",
        "target_dir": RAW_DIR / "plant_health" / "paddy_doctor"
    },
    "custom_field": {
        "url": "LOCAL_CAPTURE",
        "description": "Custom smartphone dataset covering broken leaves, physical tears, chewing damage, and negative non-plant images.",
        "target_dir": RAW_DIR / "custom"
    }
}

def init_dataset_structure():
    """Initializes the complete standardized directory layout for agricultural datasets."""
    dirs = [
        RAW_DIR / "plant_health",
        RAW_DIR / "pest",
        RAW_DIR / "damage",
        RAW_DIR / "negative",
        RAW_DIR / "custom",
        PROCESSED_DIR / "train",
        PROCESSED_DIR / "validation",
        PROCESSED_DIR / "test",
        ANNOTATIONS_DIR / "detection",
        ANNOTATIONS_DIR / "classification",
        ANNOTATIONS_DIR / "segmentation",
        METADATA_DIR,
        SPLITS_DIR
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
    
    metadata_file = METADATA_DIR / "dataset_manifest.json"
    if not metadata_file.exists():
        manifest = {
            "version": "1.0.0",
            "sources": {k: {"url": v["url"], "description": v["description"], "path": str(v["target_dir"])} for k, v in VERIFIED_DATASET_SOURCES.items()},
            "expected_classes": json.load(open("config/classes.json"))
        }
        with open(metadata_file, "w") as f:
            json.dump(manifest, f, indent=2)
    
    logger.info("Dataset layout initialized successfully at: %s", DATASET_ROOT.resolve())
    return True

def verify_raw_dataset_availability():
    """Verifies which datasets are currently populated in raw directory."""
    status = {}
    for name, info in VERIFIED_DATASET_SOURCES.items():
        p = info["target_dir"]
        count = len(list(p.glob("**/*.*"))) if p.exists() else 0
        status[name] = {
            "path": str(p),
            "files_found": count,
            "ready": count > 0
        }
        logger.info("Dataset [%s]: %d images located at %s", name, count, p)
    return status

if __name__ == "__main__":
    init_dataset_structure()
    verify_raw_dataset_availability()
