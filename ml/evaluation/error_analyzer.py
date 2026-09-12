"""
Plant Vision Error Analysis Engine
Automatically categorizes diagnostic errors and populates diagnostic folders:
- reports/confusion_matrix/
- reports/false_positives/
- reports/false_negatives/
- reports/difficult_samples/
- reports/calibration/
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

from ml.common import REPORTS_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ErrorAnalyzer")

SUBDIRS = [
    REPORTS_DIR / "confusion_matrix",
    REPORTS_DIR / "false_positives",
    REPORTS_DIR / "false_negatives",
    REPORTS_DIR / "difficult_samples",
    REPORTS_DIR / "calibration"
]

def init_report_directories():
    """Provisions structured error reporting directories."""
    for d in SUBDIRS:
        d.mkdir(parents=True, exist_ok=True)
    logger.info("Report directories initialized under %s", REPORTS_DIR.resolve())

def analyze_and_report_errors(test_predictions):
    """
    Categorizes failure modes:
    - False pest alarms (e.g. leaf spots confused for insects)
    - Missed cryptic pests
    - Healthy leaves misidentified as damaged due to lighting shadows
    - Severe blur / dark failures
    """
    init_report_directories()

    false_positives = []
    false_negatives = []
    difficult_samples = []

    for item in test_predictions:
        true_label = item.get("ground_truth")
        pred_label = item.get("prediction")
        conf = item.get("confidence", 0.0)
        img_id = item.get("image_id", "unknown")
        failure_type = item.get("failure_type", "general")

        if true_label != pred_label:
            entry = {
                "image_id": img_id,
                "ground_truth": true_label,
                "prediction": pred_label,
                "confidence": conf,
                "failure_reason": failure_type
            }

            if pred_label in ["pest_detected", "damaged"] and true_label == "healthy":
                false_positives.append(entry)
            elif true_label in ["pest_detected", "damaged"] and pred_label == "healthy":
                false_negatives.append(entry)

            if 0.50 <= conf <= 0.70:
                difficult_samples.append(entry)

    # Write breakdown reports
    with open(REPORTS_DIR / "false_positives" / "false_positives_report.json", "w") as f:
        json.dump(false_positives, f, indent=2)

    with open(REPORTS_DIR / "false_negatives" / "false_negatives_report.json", "w") as f:
        json.dump(false_negatives, f, indent=2)

    with open(REPORTS_DIR / "difficult_samples" / "borderline_cases.json", "w") as f:
        json.dump(difficult_samples, f, indent=2)

    logger.info("Error analysis complete: %d False Positives, %d False Negatives, %d Borderline Samples logged.",
                len(false_positives), len(false_negatives), len(difficult_samples))
    return {
        "false_positive_count": len(false_positives),
        "false_negative_count": len(false_negatives),
        "difficult_sample_count": len(difficult_samples)
    }

if __name__ == "__main__":
    init_report_directories()
    # Template run
    sample_errors = [
        {"image_id": "field_01_004.jpg", "ground_truth": "healthy", "prediction": "pest_detected", "confidence": 0.68, "failure_type": "dirt_speck_confused_for_insect"},
        {"image_id": "field_02_012.jpg", "ground_truth": "damaged", "prediction": "healthy", "confidence": 0.58, "failure_type": "micro_tear_on_margin_missed"}
    ]
    analyze_and_report_errors(sample_errors)
