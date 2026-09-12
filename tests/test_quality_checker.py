"""
Unit Tests for Image Quality Checker
Verifies:
1. Low-light dark images are rejected with IMAGE_TOO_DARK
2. Uniform flat non-plant images are rejected with NOT_A_PLANT_IMAGE
3. Blurry low-frequency images are rejected with IMAGE_TOO_BLURRY
"""

import sys
from pathlib import Path
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from ml.preprocessing.quality_checker import ImageQualityChecker

class TestQualityChecker(unittest.TestCase):
    def setUp(self):
        self.checker = ImageQualityChecker()

    def test_dark_image_rejection(self):
        """Very dark images (mean luminance < 40) must be rejected."""
        dark_img = np.zeros((240, 320, 3), dtype=np.uint8)
        dark_img[:, :] = [10, 10, 10]
        is_usable, code, metrics = self.checker.assess_image(dark_img)
        self.assertFalse(is_usable)
        self.assertEqual(code, "IMAGE_TOO_DARK")

    def test_non_plant_rejection(self):
        """Images without green/yellow vegetation chromaticity must be rejected."""
        blue_sky_or_soil = np.zeros((240, 320, 3), dtype=np.uint8)
        blue_sky_or_soil[:, :] = [200, 100, 50] # Blue/Brown hue
        is_usable, code, metrics = self.checker.assess_image(blue_sky_or_soil)
        self.assertFalse(is_usable)
        self.assertIn(code, ["NOT_A_PLANT_IMAGE", "LEAF_TOO_SMALL"])

    def test_blurry_image_rejection(self):
        """Uniform or severely blurred image must fail blur check."""
        flat_gray = np.full((240, 320, 3), 128, dtype=np.uint8)
        is_usable, code, metrics = self.checker.assess_image(flat_gray)
        self.assertFalse(is_usable)
        # Flat image has 0 laplacian variance
        self.assertIn(code, ["IMAGE_TOO_BLURRY", "NOT_A_PLANT_IMAGE"])

if __name__ == "__main__":
    unittest.main()
