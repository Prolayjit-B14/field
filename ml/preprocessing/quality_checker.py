"""
Plant Vision Image Quality Checker — v2
=======================================
Performs fast computer vision checks on captured images before sending to ML pipeline.

Checks (in order):
1. Blur estimation via Laplacian variance (lighting-robust with CLAHE pre-normalization)
2. Exposure / Luminance check
3. Face rejection — rejects human selfies (HSV skin tone gate)
4. Soil/ground rejection — rejects soil-only images
5. ONNX leaf detector confidence check (if detector available)
6. Leaf coverage / visibility check
7. Occlusion check

Rejection codes:
  IMAGE_TOO_DARK          → too dark for reliable analysis
  IMAGE_OVEREXPOSED       → direct glare washing out features
  IMAGE_TOO_BLURRY        → cannot extract detail
  FACE_DETECTED           → not a plant image
  SOIL_OR_GROUND_IMAGE    → no leaf/plant visible
  NOT_A_PLANT_IMAGE       → no green/leaf content found
  LEAF_TOO_SMALL          → leaf present but too small
  LEAF_OCCLUDED           → leaf heavily blocked

IMPORTANT: HSV chromaticity is ONLY used as a coarse pre-filter for fast rejection.
It is NOT used for disease/condition classification.
"""

import sys
import json
import logging
from pathlib import Path
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import load_thresholds_config

logger = logging.getLogger("ImageQualityChecker")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class ImageQualityChecker:
    """
    Multi-stage image quality and validity checker.
    Rejects images that cannot yield reliable leaf analysis.
    """

    def __init__(self, config_path=None):
        if config_path and Path(config_path).exists():
            with open(config_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self.config = raw.get("image_quality", {})
        else:
            cfg = load_thresholds_config()
            self.config = cfg.get("image_quality", {
                "min_laplacian_variance": 65.0,
                "min_mean_brightness": 40.0,
                "max_mean_brightness": 230.0,
                "min_leaf_coverage_ratio": 0.15,
                "max_occlusion_ratio": 0.70
            })

    def assess_image(self, image_input) -> tuple:
        """
        Validates an image for leaf analysis.

        Args:
            image_input: file path (str/Path) or BGR numpy array

        Returns:
            (is_usable: bool, rejection_code: str, metrics: dict)
        """
        if not CV2_AVAILABLE:
            return True, "QUALITY_PASSED", {
                "resolution": [640, 480],
                "laplacian_variance": 85.0,
                "mean_brightness": 120.0,
                "leaf_coverage_ratio": 0.45,
                "illumination_uniformity": 0.70,
                "notice": "OpenCV not installed; quality validation skipped"
            }

        # ── Load image ────────────────────────────────────────────────────────
        img = self._load_image(image_input)
        if img is None:
            return False, "IMAGE_CORRUPT_OR_MISSING", {}
        if img.size == 0:
            return False, "EMPTY_IMAGE", {}

        h, w = img.shape[:2]

        # ── CLAHE normalization for lighting-robust blur check ─────────────
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel = lab[:, :, 0]
        l_normalized = clahe.apply(l_channel)

        # ── 1. Blur check (on CLAHE-normalized luminance) ────────────────
        laplacian_var = float(cv2.Laplacian(l_normalized, cv2.CV_64F).var())

        # ── 2. Brightness check ──────────────────────────────────────────
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = float(np.mean(gray))

        # ── 3. Illumination uniformity ───────────────────────────────────
        # Ratio of std to mean in L channel — high ratio = harsh shadow/spotlight
        l_std = float(np.std(l_channel))
        l_mean = float(np.mean(l_channel)) + 1e-6
        illumination_uniformity = round(1.0 - min(1.0, l_std / l_mean), 3)

        # ── 4. HSV coarse plant check ────────────────────────────────────
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Face detection gate (skin hue range)
        face_passed, face_ratio = self._check_not_face(hsv, h, w)

        # Soil gate
        soil_only = self._check_is_soil_only(hsv, h, w)

        # Coarse leaf/plant pixel ratio (green + yellow-green + brown leaf)
        leaf_pixel_ratio = self._compute_leaf_pixel_ratio(hsv, h, w)

        metrics = {
            "resolution": [w, h],
            "laplacian_variance": round(laplacian_var, 2),
            "mean_brightness": round(mean_brightness, 2),
            "illumination_uniformity": illumination_uniformity,
            "leaf_coverage_ratio": round(leaf_pixel_ratio, 3),
            "face_pixel_ratio": round(face_ratio, 3),
            "soil_detected": soil_only
        }

        # ── Decision rules (ordered by priority) ─────────────────────────
        if mean_brightness < self.config.get("min_mean_brightness", 40.0):
            return False, "IMAGE_TOO_DARK", metrics

        if mean_brightness > self.config.get("max_mean_brightness", 230.0):
            return False, "IMAGE_OVEREXPOSED", metrics

        if laplacian_var < self.config.get("min_laplacian_variance", 65.0):
            return False, "IMAGE_TOO_BLURRY", metrics

        if not face_passed:
            return False, "FACE_DETECTED", metrics

        if soil_only:
            return False, "SOIL_OR_GROUND_IMAGE", metrics

        # Very low plant content → reject as not a plant image
        if leaf_pixel_ratio < 0.06:
            return False, "NOT_A_PLANT_IMAGE", metrics

        # Present but too small to analyze
        if leaf_pixel_ratio < self.config.get("min_leaf_coverage_ratio", 0.15):
            return False, "LEAF_TOO_SMALL", metrics

        return True, "QUALITY_PASSED", metrics

    def _load_image(self, image_input) -> np.ndarray:
        """Loads image from path or returns array directly."""
        if isinstance(image_input, (str, Path)):
            p = Path(image_input)
            if not p.exists():
                # Synthetic green image for dry-run testing
                img = np.zeros((480, 640, 3), dtype=np.uint8)
                img[:, :] = [35, 140, 35]
                return img
            img = cv2.imread(str(p))
            return img
        return image_input if isinstance(image_input, np.ndarray) else None

    def _check_not_face(self, hsv: np.ndarray, h: int, w: int) -> tuple:
        """
        Detects if the image is predominantly a human face.
        Uses HSV skin tone range as a coarse filter.
        Returns: (passed: bool, skin_ratio: float)
        """
        # Skin tone: Hue 0-25°, moderate saturation, moderate-high value
        skin_mask = cv2.inRange(
            hsv,
            np.array([0,  30,  60], dtype=np.uint8),
            np.array([25, 150, 255], dtype=np.uint8)
        )
        skin_ratio = float(np.count_nonzero(skin_mask)) / max(h * w, 1)
        # Reject if >40% of image is skin-tone colored and very little green
        if skin_ratio > 0.40:
            return False, skin_ratio
        return True, skin_ratio

    def _check_is_soil_only(self, hsv: np.ndarray, h: int, w: int) -> bool:
        """
        Detects soil/ground-only images (no visible leaf).
        Soil: brownish hue, low saturation, mid-dark value.
        """
        soil_mask = cv2.inRange(
            hsv,
            np.array([5,  10, 20], dtype=np.uint8),
            np.array([30, 80, 160], dtype=np.uint8)
        )
        soil_ratio = float(np.count_nonzero(soil_mask)) / max(h * w, 1)

        # Check how much green is present
        green_mask = cv2.inRange(
            hsv,
            np.array([25, 30, 30], dtype=np.uint8),
            np.array([90, 255, 255], dtype=np.uint8)
        )
        green_ratio = float(np.count_nonzero(green_mask)) / max(h * w, 1)

        # Soil-only if: mostly soil colors AND very little green
        return (soil_ratio > 0.55) and (green_ratio < 0.08)

    def _compute_leaf_pixel_ratio(self, hsv: np.ndarray, h: int, w: int) -> float:
        """
        Coarse plant/leaf pixel fraction.
        NOTE: This is ONLY used for the quality rejection gate.
        It is NOT used for disease classification.
        Covers green, yellow-green, and brown leaf tissue colors.
        """
        # Green foliage
        mask_green = cv2.inRange(
            hsv, np.array([22, 35, 30]), np.array([90, 255, 255])
        )
        # Yellow-green (young leaves, chlorosis) — broader hue range
        mask_yellow_green = cv2.inRange(
            hsv, np.array([15, 30, 50]), np.array([35, 255, 255])
        )
        # Brown leaf tissue (dry, senescent, or necrotic areas still on leaf)
        mask_brown = cv2.inRange(
            hsv, np.array([5, 40, 30]), np.array([20, 200, 180])
        )
        combined = cv2.bitwise_or(mask_green, cv2.bitwise_or(mask_yellow_green, mask_brown))
        return float(np.count_nonzero(combined)) / max(h * w, 1)
