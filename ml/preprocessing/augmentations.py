"""
Agricultural Image Augmentation Pipeline — v2
=============================================
Applies realistic, biologically valid augmentations for training leaf disease models.

Key principles (per spec section 11):
- Simulates real smartphone capture conditions (lighting, shadows, blur, orientation)
- Does NOT change disease-characteristic patterns (lesion color, shape, distribution)
- Does NOT apply extreme warping that distorts lesion geometry
- Supports background variation for generalization beyond white-background datasets

Augmentations included:
  - Subtle rotation (±20°)
  - Scale + random crop (0.80-1.20)
  - Horizontal flip (biologically valid for most leaves)
  - Vertical flip (optional, disabled by default — not always biologically appropriate)
  - Brightness variation (exposure shift)
  - Contrast jitter (independent of brightness)
  - Blur (simulates handheld jitter / focus drift)
  - Gaussian noise (simulates sensor noise in low-light)
  - Shadow injection (simulates canopy / hand occlusion)
  - Background variation (pastes leaf ROI on random backgrounds)

NOT included (per spec):
  - Extreme hue shift (would alter disease lesion color — misleading)
  - Elastic distortion (alters lesion geometry)
  - Massive scale changes that remove most of the leaf
"""

import cv2
import numpy as np
import random
import json
from pathlib import Path


class AgriculturalAugmenter:
    """
    Realistic agricultural augmentation pipeline for training leaf analysis models.
    Input/output: BGR OpenCV numpy arrays (uint8).
    """

    def __init__(self, config_path: str = "config/preprocessing.json"):
        cfg_file = Path(config_path)
        if cfg_file.exists():
            with open(cfg_file) as f:
                self.config = json.load(f).get("augmentations", {})
        else:
            self.config = {
                "rotation_limit_deg": 20,
                "brightness_contrast_limit": 0.20,
                "horizontal_flip_prob": 0.50,
                "vertical_flip_prob": 0.10,       # low — not always biologically appropriate
                "blur_limit_kernel": 5,
                "noise_sigma_range": [3, 12],
                "shadow_injection_prob": 0.30,
                "scale_range": [0.80, 1.20],
                "background_variation_prob": 0.15  # requires background_dirs to be set
            }
        self.background_images = []  # populated by set_background_dirs()

    # ── Core augmentations ────────────────────────────────────────────────────

    def apply_subtle_rotation(self, image: np.ndarray) -> np.ndarray:
        """Rotates leaf naturally without severe corner cropping."""
        limit = self.config.get("rotation_limit_deg", 20)
        angle = random.uniform(-limit, limit)
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(image, M, (w, h), borderMode=cv2.BORDER_REFLECT)

    def apply_scale_crop(self, image: np.ndarray, target_size: int = 384) -> np.ndarray:
        """
        Random scale then center crop to target_size.
        Simulates different camera distances. Preserves leaf proportion.
        """
        scale_min, scale_max = self.config.get("scale_range", [0.80, 1.20])
        scale = random.uniform(scale_min, scale_max)
        h, w = image.shape[:2]
        new_h = int(h * scale)
        new_w = int(w * scale)
        scaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Center crop or pad to target_size
        out = np.zeros((target_size, target_size, 3), dtype=np.uint8)
        crop_h = min(new_h, target_size)
        crop_w = min(new_w, target_size)
        y_start = max(0, (new_h - target_size) // 2)
        x_start = max(0, (new_w - target_size) // 2)
        out_y = max(0, (target_size - crop_h) // 2)
        out_x = max(0, (target_size - crop_w) // 2)
        out[out_y:out_y + crop_h, out_x:out_x + crop_w] = \
            scaled[y_start:y_start + crop_h, x_start:x_start + crop_w]
        return out

    def apply_exposure_shift(self, image: np.ndarray) -> np.ndarray:
        """
        Simulates outdoor lighting variation (cloud cover, morning vs midday).
        Operates on Value channel only — preserves Hue and Saturation.
        """
        limit = self.config.get("brightness_contrast_limit", 0.20)
        factor = 1.0 + random.uniform(-limit, limit)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * factor, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    def apply_contrast_jitter(self, image: np.ndarray) -> np.ndarray:
        """
        Independently adjusts contrast (CLAHE-like effect without removing lesion features).
        Simulates different camera sensor contrast settings.
        """
        limit = self.config.get("brightness_contrast_limit", 0.20)
        alpha = 1.0 + random.uniform(-limit, limit)  # contrast factor
        beta = random.uniform(-10, 10)                 # brightness addend
        adjusted = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
        return adjusted

    def apply_blur(self, image: np.ndarray) -> np.ndarray:
        """
        Simulates handheld camera jitter / mild focus drift.
        Kernel is always odd and limited to avoid destroying disease patterns.
        """
        max_k = self.config.get("blur_limit_kernel", 5)
        k = random.choice([3, max_k if max_k % 2 == 1 else max_k - 1])
        return cv2.GaussianBlur(image, (k, k), 0)

    def apply_noise(self, image: np.ndarray) -> np.ndarray:
        """
        Adds Gaussian sensor noise. Simulates low-light smartphone captures.
        Sigma is limited to avoid masking lesion texture features.
        """
        sigma_min, sigma_max = self.config.get("noise_sigma_range", [3, 12])
        sigma = random.uniform(sigma_min, sigma_max)
        noise = np.random.normal(0, sigma, image.shape).astype(np.float32)
        noisy = np.clip(image.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        return noisy

    def apply_shadow_injection(self, image: np.ndarray) -> np.ndarray:
        """
        Injects a subtle shadow polygon simulating hand/canopy occlusion.
        Shadow boundary is Gaussian-blurred for realism.
        """
        if random.random() > self.config.get("shadow_injection_prob", 0.30):
            return image
        h, w = image.shape[:2]
        mask = np.ones((h, w), dtype=np.float32)
        pts = np.array([
            [random.randint(0, w // 2), 0],
            [random.randint(w // 2, w), 0],
            [random.randint(w // 2, w), h],
            [random.randint(0, w // 2), h]
        ], np.int32)
        shadow_intensity = random.uniform(0.60, 0.85)
        cv2.fillPoly(mask, [pts], shadow_intensity)
        mask = cv2.GaussianBlur(mask, (51, 51), 0)
        shadowed = (image.astype(np.float32) * mask[:, :, np.newaxis]).astype(np.uint8)
        return shadowed

    def apply_background_variation(self, image: np.ndarray) -> np.ndarray:
        """
        Replaces the image background with a random field/garden background.
        Critical for models trained on white-background PlantVillage to generalize
        to field-condition PlantDoc images.

        Requires self.background_images to be populated via set_background_dirs().
        Falls back to a solid color background if no images available.
        """
        if not self.background_images:
            # Fallback: solid earthy/sky background
            h, w = image.shape[:2]
            bg_colors = [
                [34, 85, 45],   # dark earth
                [120, 180, 80], # bright field
                [200, 220, 180] # pale sky
            ]
            bg = np.full((h, w, 3), random.choice(bg_colors), dtype=np.uint8)
        else:
            bg_img = random.choice(self.background_images)
            bg = cv2.resize(bg_img, (image.shape[1], image.shape[0]))

        # Simple green-channel mask to isolate leaf (very coarse — only for augmentation)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        leaf_mask = cv2.inRange(hsv,
                                np.array([15, 30, 30]),
                                np.array([90, 255, 255]))
        leaf_mask_3ch = cv2.cvtColor(leaf_mask, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
        composite = (image.astype(np.float32) * leaf_mask_3ch +
                     bg.astype(np.float32) * (1.0 - leaf_mask_3ch)).astype(np.uint8)
        return composite

    def set_background_dirs(self, bg_paths: list):
        """Loads background images from a list of file paths or directories."""
        self.background_images = []
        for p in bg_paths:
            p = Path(p)
            if p.is_file():
                img = cv2.imread(str(p))
                if img is not None:
                    self.background_images.append(img)
            elif p.is_dir():
                for f in p.glob("*.jpg"):
                    img = cv2.imread(str(f))
                    if img is not None:
                        self.background_images.append(img)

    # ── Main pipeline ─────────────────────────────────────────────────────────

    def augment(self, image: np.ndarray, target_size: int = 384) -> np.ndarray:
        """
        Runs the full sequential agricultural augmentation pipeline.

        Args:
            image: BGR OpenCV array (uint8)
            target_size: output spatial size for scale/crop step

        Returns:
            Augmented BGR array at target_size × target_size
        """
        img = image.copy()

        # 1. Horizontal flip (biologically safe)
        if random.random() < self.config.get("horizontal_flip_prob", 0.50):
            img = cv2.flip(img, 1)

        # 2. Vertical flip (low probability — not always meaningful)
        if random.random() < self.config.get("vertical_flip_prob", 0.10):
            img = cv2.flip(img, 0)

        # 3. Subtle rotation (preserves disease pattern geometry at small angles)
        img = self.apply_subtle_rotation(img)

        # 4. Scale + crop
        img = self.apply_scale_crop(img, target_size=target_size)

        # 5. Natural lighting shift (value channel only)
        img = self.apply_exposure_shift(img)

        # 6. Contrast jitter (independent channel)
        img = self.apply_contrast_jitter(img)

        # 7. Shadow injection
        img = self.apply_shadow_injection(img)

        # 8. Gaussian noise
        if random.random() < 0.40:
            img = self.apply_noise(img)

        # 9. Mild blur (rare — only simulates focus issues)
        if random.random() < 0.20:
            img = self.apply_blur(img)

        # 10. Background variation (only when background images loaded)
        if self.background_images and random.random() < self.config.get("background_variation_prob", 0.15):
            img = self.apply_background_variation(img)

        return img
