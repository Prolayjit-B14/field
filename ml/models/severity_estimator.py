"""
Severity Estimator
==================
Estimates disease/damage severity from segmented mask areas — NOT from raw pixel colors.

Severity formula:
  affected_area_ratio = affected_leaf_pixels / total_valid_leaf_pixels

where:
  affected_leaf_pixels = union of (damage_mask + disease_lesion_mask)
  total_valid_leaf_pixels = leaf_segmentation_mask area (from ONNX detector)

IMPORTANT: This uses spatial mask data from trained models, not HSV color percentages.
Thresholds come from config/thresholds.json and MUST be validated against expert labels.

Severity levels: NONE | MILD | MODERATE | SEVERE | UNKNOWN
"""

import sys
import logging
from pathlib import Path
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import load_thresholds_config

logger = logging.getLogger("SeverityEstimator")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class SeverityEstimator:
    """
    Mask-area-based severity estimator.
    Uses spatial masks from trained segmentation/detection models.
    """

    LEVELS = ["NONE", "MILD", "MODERATE", "SEVERE", "UNKNOWN"]

    def __init__(self, thresholds: dict | None = None):
        cfg = thresholds or load_thresholds_config()
        sev = cfg.get("severity", {})
        self.none_max     = float(sev.get("none_max_ratio", 0.02))
        self.mild_max     = float(sev.get("mild_max_ratio", 0.15))
        self.moderate_max = float(sev.get("moderate_max_ratio", 0.40))
        self.unknown_if_no_mask = bool(sev.get("unknown_if_mask_unavailable", True))

    def estimate(
        self,
        leaf_mask: np.ndarray = None,
        damage_mask: np.ndarray = None,
        lesion_mask: np.ndarray = None
    ) -> dict:
        """
        Estimates severity from model-generated masks.

        Args:
            leaf_mask:   bool H×W — pixels belonging to the leaf (from ONNX detector)
            damage_mask: bool/float H×W — physical damage regions (from DamageDetector.mask_head)
            lesion_mask: bool/float H×W — disease lesion regions (from any segmentation model)

        Returns:
            {
              "level": str — NONE | MILD | MODERATE | SEVERE | UNKNOWN
              "affected_area_ratio": float
              "affected_area_percent": float
              "method": str
            }
        """
        # If no leaf mask available, cannot compute reliable severity
        if leaf_mask is None:
            return self._unknown("no_leaf_mask")

        total_leaf_pixels = int(leaf_mask.sum()) if hasattr(leaf_mask, 'sum') else 0
        if total_leaf_pixels < 100:
            return self._unknown("leaf_mask_too_small")

        # Build union of all affected masks
        affected = np.zeros_like(leaf_mask, dtype=bool)
        masks_used = []

        if damage_mask is not None:
            dm = damage_mask > 0.5 if damage_mask.dtype != bool else damage_mask
            # Only count damage within the leaf region
            dm_in_leaf = dm & leaf_mask
            affected = affected | dm_in_leaf
            masks_used.append("damage_mask")

        if lesion_mask is not None:
            lm = lesion_mask > 0.5 if lesion_mask.dtype != bool else lesion_mask
            lm_in_leaf = lm & leaf_mask
            affected = affected | lm_in_leaf
            masks_used.append("lesion_mask")

        if not masks_used:
            return self._unknown("no_condition_masks_provided")

        affected_pixels = int(affected.sum())
        ratio = affected_pixels / max(total_leaf_pixels, 1)
        percent = round(ratio * 100, 1)

        level = self._classify_ratio(ratio)

        return {
            "level": level,
            "affected_area_ratio": round(ratio, 4),
            "affected_area_percent": percent,
            "method": "mask_area_ratio",
            "masks_used": masks_used,
            "total_leaf_pixels": total_leaf_pixels,
            "affected_pixels": affected_pixels
        }

    def estimate_from_28x28_mask(
        self,
        leaf_mask: np.ndarray,
        damage_mask_28: np.ndarray,
        original_h: int,
        original_w: int
    ) -> dict:
        """
        Handles the 28×28 low-resolution damage mask from DamageDetector.mask_head.
        Upsamples to original image resolution before computing the ratio.
        """
        if not CV2_AVAILABLE:
            return self._unknown("opencv_unavailable_for_upsample")

        if damage_mask_28 is None or leaf_mask is None:
            return self._unknown("missing_mask")

        # Upsample 28×28 → original resolution
        mask_resized = cv2.resize(
            damage_mask_28.astype(np.float32),
            (original_w, original_h),
            interpolation=cv2.INTER_LINEAR
        )
        return self.estimate(leaf_mask=leaf_mask, damage_mask=mask_resized)

    def _classify_ratio(self, ratio: float) -> str:
        """Maps affected area ratio to severity level using calibrated thresholds."""
        if ratio <= self.none_max:
            return "NONE"
        elif ratio <= self.mild_max:
            return "MILD"
        elif ratio <= self.moderate_max:
            return "MODERATE"
        else:
            return "SEVERE"

    def _unknown(self, reason: str) -> dict:
        return {
            "level": "UNKNOWN",
            "affected_area_ratio": None,
            "affected_area_percent": None,
            "method": "unavailable",
            "reason": reason
        }
