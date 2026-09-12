"""
Plant Vision Common Utilities & Path Resolver
Ensures reliable execution regardless of current working directory or entrypoint.
Includes ONNX model paths, model/dataset versioning constants, and config helpers.
"""

import sys
import os
import json
from pathlib import Path

# Compute absolute path to repository root
FILE_PATH = Path(__file__).resolve()
ML_DIR = FILE_PATH.parent
PROJECT_ROOT = ML_DIR.parent

# Ensure project root is at index 0 of sys.path
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ── Standardized Directory Paths ──────────────────────────────────────────────
CONFIG_DIR          = PROJECT_ROOT / "config"
DATASETS_DIR        = PROJECT_ROOT / "datasets"
REPORTS_DIR         = PROJECT_ROOT / "reports"
MODELS_CHECKPOINTS_DIR = ML_DIR / "models" / "checkpoints"
MLRUNS_DIR          = PROJECT_ROOT / "mlruns"

# ── ONNX Leaf Edge Detector ───────────────────────────────────────────────────
ONNX_MODEL_PATH = PROJECT_ROOT / "sih_crop_edge_model.onnx"

def get_onnx_model_path() -> Path:
    """Returns the absolute path to the SIH ONNX leaf edge model.
    Raises FileNotFoundError if the model is missing."""
    if not ONNX_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"ONNX leaf detector model not found at: {ONNX_MODEL_PATH}. "
            "Place sih_crop_edge_model.onnx in the project root."
        )
    return ONNX_MODEL_PATH

# ── Model & Dataset Versioning ────────────────────────────────────────────────
MODEL_VERSION         = "leaf-health-1.0.0"
DATASET_VERSION       = "dataset-2026-09"
PREPROCESSING_VERSION = "preprocess-2.0"

def get_version_manifest() -> dict:
    """Returns structured version info to include in every inference output."""
    return {
        "model_version": MODEL_VERSION,
        "dataset_version": DATASET_VERSION,
        "preprocessing_version": PREPROCESSING_VERSION
    }

# ── Config Helpers ────────────────────────────────────────────────────────────

def get_config_path(filename: str) -> Path:
    """Returns absolute path to a configuration file."""
    return CONFIG_DIR / filename

def load_json_config(filename: str, default: dict | None = None) -> dict:
    """Generic safe JSON config loader."""
    path = get_config_path(filename)
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default or {}

def load_classes_config() -> dict:
    """Loads the hierarchical class taxonomy from config/classes.json."""
    return load_json_config("classes.json", default={
        "mvp_top_level_classes": {
            "labels": ["HEALTHY", "DISEASE", "PEST_DAMAGE", "PHYSICAL_DAMAGE", "STRESS", "MULTIPLE_CONDITIONS", "UNKNOWN"]
        },
        "legacy_compat": {
            "plant_detection": ["plant", "leaf", "background"],
            "leaf_condition": ["healthy", "abnormal", "uncertain"],
            "physical_damage": ["intact", "torn", "broken", "hole_damage", "damaged_edge", "uncertain"],
            "pest_detection": ["pest_visible", "pest_not_visible", "possible_pest_damage", "uncertain"],
            "color_condition": ["normal_green", "yellowing", "browning", "abnormal_discoloration", "uncertain"]
        }
    })

def load_thresholds_config() -> dict:
    """Loads operational thresholds from config/thresholds.json."""
    return load_json_config("thresholds.json", default={
        "image_quality": {
            "min_laplacian_variance": 65.0,
            "min_mean_brightness": 40.0,
            "max_mean_brightness": 230.0,
            "min_leaf_coverage_ratio": 0.15
        },
        "onnx_leaf_detector": {"min_leaf_confidence": 0.40, "mask_binary_threshold": 0.50},
        "disease_classifier": {"min_confidence": 0.72},
        "severity": {"none_max_ratio": 0.02, "mild_max_ratio": 0.15, "moderate_max_ratio": 0.40},
        "overall": {"low_confidence_threshold": 0.55, "unknown_threshold": 0.40},
        "pest_detector": {"confirmed_pest_confidence": 0.82},
        "damage_detector": {"confirmed_damage_confidence": 0.78}
    })

def load_preprocessing_config() -> dict:
    """Loads preprocessing config from config/preprocessing.json."""
    return load_json_config("preprocessing.json", default={
        "classification_input_size": [384, 384],
        "detection_input_size": [640, 640],
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}
    })

def load_recommendation_db() -> dict:
    """Loads the verified agricultural recommendation knowledge base."""
    return load_json_config("recommendation_db.json", default={})

def load_dataset_registry() -> dict:
    """Loads the dataset catalog for training reference."""
    return load_json_config("dataset_registry.json", default={})
