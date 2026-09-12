"""
Custom Agricultural Dataset Collector & Specification
Enforces collection guidelines for the 14 mandatory edge-case classes
not adequately covered by generic academic disease datasets.
"""

import sys
import json
from pathlib import Path

# Ensure project root is in sys.path
CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import DATASETS_DIR

CUSTOM_DATASET_SPEC = {
    "version": "1.0.0",
    "project": "Chasi-AgriSense-Vision",
    "target_directory": str(DATASETS_DIR / "raw" / "custom"),
    "categories": [
        {
            "id": 1,
            "category": "healthy_intact",
            "description": "Crisp, fully intact leaves without tears, holes, or abnormal spots.",
            "target_count": 500
        },
        {
            "id": 2,
            "category": "physically_broken_torn",
            "description": "Leaves with fractured petioles, snapped midribs, or split blades (wind/mechanical).",
            "target_count": 400
        },
        {
            "id": 3,
            "category": "holes_chewing_damage",
            "description": "Perforated leaf blades with distinct missing tissue and chewing margins.",
            "target_count": 400
        },
        {
            "id": 4,
            "category": "insect_visible_leaves",
            "description": "Leaves with clearly visible insects (aphids, caterpillars, beetles, hoppers).",
            "target_count": 450
        },
        {
            "id": 5,
            "category": "pest_feeding_damage_no_insect",
            "description": "Stippling, honeydew, frass, or skeletonization where insect has moved away.",
            "target_count": 350
        },
        {
            "id": 6,
            "category": "discoloration_non_disease",
            "description": "Sun scorch, nutrient deficiency chlorosis, senescence, yellowing without lesions.",
            "target_count": 350
        },
        {
            "id": 7,
            "category": "lighting_variations",
            "description": "Direct harsh noon sunlight, dawn/dusk shade, cloudy, overcast, indoor flash.",
            "target_count": 300
        },
        {
            "id": 8,
            "category": "blurry_motion",
            "description": "Unfocused, hand-shake, or wind-fluttered blurred photos (Quality Gate negatives).",
            "target_count": 250
        },
        {
            "id": 9,
            "category": "partially_occluded",
            "description": "Leaves behind stems, shadows, dew drops, or fingers holding the leaf.",
            "target_count": 250
        },
        {
            "id": 10,
            "category": "non_plant_negatives",
            "description": "Human hands/faces, farm tools, tractors, boots, clothing (Rejection Gate negatives).",
            "target_count": 300
        },
        {
            "id": 11,
            "category": "soil_background_only",
            "description": "Clay, loam, paddy mud, gravel, dry cracked earth with no leaf (Rejection Gate negatives).",
            "target_count": 250
        },
        {
            "id": 12,
            "category": "multiple_overlapping_leaves",
            "description": "Dense canopy views with multiple overlapping leaves to train extraction.",
            "target_count": 300
        },
        {
            "id": 13,
            "category": "small_distant_leaves",
            "description": "Leaves photographed too far away (<20% frame area) to trigger 'Move Closer'.",
            "target_count": 250
        },
        {
            "id": 14,
            "category": "real_smartphone_mix",
            "description": "Uncurated captures across diverse Android models (Samsung, Xiaomi, Realme, Vivo).",
            "target_count": 400
        }
    ]
}

def init_custom_dataset_folders():
    """Initializes the subdirectories for all 14 custom data categories."""
    base = Path(CUSTOM_DATASET_SPEC["target_directory"])
    base.mkdir(parents=True, exist_ok=True)
    
    for cat in CUSTOM_DATASET_SPEC["categories"]:
        folder = base / cat["category"]
        folder.mkdir(parents=True, exist_ok=True)
        readme = folder / "README.txt"
        if not readme.exists():
            with open(readme, "w") as f:
                f.write(f"Category: {cat['category']}\nTarget: {cat['target_count']} images\nDescription: {cat['description']}\n")

    spec_file = base / "collection_specification.json"
    with open(spec_file, "w") as f:
        json.dump(CUSTOM_DATASET_SPEC, f, indent=2)

    print(f"Custom dataset folders initialized at {base.resolve()}")

if __name__ == "__main__":
    init_custom_dataset_folders()
