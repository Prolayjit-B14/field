"""
Disease Classifier — EfficientNet-B3 Backbone
==============================================
Fine-grained disease classification head operating on cropped, segmented leaf ROI.

Architecture:
  EfficientNet-B3 pretrained on ImageNet (torchvision)
  → AdaptiveAvgPool2d(1)
  → Dropout(0.35)
  → Linear(1536, 512) + SiLU
  → Dropout(0.20)
  → Linear(512, num_disease_classes)
  → Temperature-scaled softmax (calibrated post-training)

Input: RGB leaf ROI tensor, 384×384, normalized with ImageNet mean/std
Output: Per-class logits; softmax probabilities after calibration

IMPORTANT LOGIC:
  - If max(softmax) < disease_min_confidence threshold → return UNKNOWN_ABNORMALITY
  - This model is ONLY invoked when the upstream condition classifier detects DISEASE
  - Never invents a specific disease name without sufficient confidence

Supported classes (MVP — expandable):
  See config/classes.json → mvp_disease_classes per crop

Dataset sources for training:
  - PlantVillage (54,306 images, 38 classes)
  - PlantDoc (2,598 real-field images)
  - Mendeley Plant Leaf Disease (4,121 raw)
  - RiceLeaf (500 rice-specific)
"""

import sys
import logging
from pathlib import Path

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

logger = logging.getLogger("DiseaseClassifier")

import torch
import torch.nn as nn

try:
    from torchvision.models import efficientnet_b3, EfficientNet_B3_Weights
    EFFICIENTNET_AVAILABLE = True
except ImportError:
    EFFICIENTNET_AVAILABLE = False
    logger.warning("EfficientNet-B3 not available in this torchvision version. Falling back to MobileNetV3.")
    from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights


# ── Default MVP disease classes across supported crops ─────────────────────────
DEFAULT_DISEASE_CLASSES = [
    "healthy",
    "tomato_early_blight",
    "tomato_late_blight",
    "tomato_leaf_mold",
    "tomato_septoria_leaf_spot",
    "tomato_target_spot",
    "tomato_mosaic_virus",
    "rice_brown_spot",
    "rice_leaf_blast",
    "potato_early_blight",
    "potato_late_blight",
    "powdery_mildew",
    "UNKNOWN_ABNORMALITY"
]

# EfficientNet-B3 last feature output channels
EFFICIENTNET_B3_FEATURES = 1536


class DiseaseClassifier(nn.Module):
    """
    EfficientNet-B3 based disease classification head.
    Falls back to MobileNetV3-Small if EfficientNet is unavailable.
    """

    def __init__(self, num_classes: int | None = None, pretrained: bool = True, class_names: list | None = None):
        super(DiseaseClassifier, self).__init__()
        self.class_names = class_names or DEFAULT_DISEASE_CLASSES
        self.num_classes = num_classes or len(self.class_names)

        if EFFICIENTNET_AVAILABLE:
            self._build_efficientnet(pretrained)
            self.backbone_name = "efficientnet_b3"
            feature_dim = EFFICIENTNET_B3_FEATURES
        else:
            self._build_mobilenet(pretrained)
            self.backbone_name = "mobilenet_v3_small"
            feature_dim = 576

        self.pool = nn.AdaptiveAvgPool2d(1)

        # Classification head with two stages of dropout
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.35),
            nn.Linear(feature_dim, 512),
            nn.SiLU(),
            nn.Dropout(p=0.20),
            nn.Linear(512, self.num_classes)
        )

        # Learnable temperature for confidence calibration (post-training)
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def _build_efficientnet(self, pretrained: bool):
        """Extracts EfficientNet-B3 feature layers, removes original head."""
        weights = EfficientNet_B3_Weights.DEFAULT if pretrained else None
        base = efficientnet_b3(weights=weights)
        # Keep feature extractor, drop avgpool + classifier
        self.features = base.features

    def _build_mobilenet(self, pretrained: bool):
        """Fallback: MobileNetV3-Small feature extractor."""
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = mobilenet_v3_small(weights=weights)
        self.features = base.features

    def forward(self, x: torch.Tensor, return_calibrated: bool = True):
        """
        Args:
            x: Tensor (N, 3, H, W) — normalized leaf ROI
            return_calibrated: if True, applies temperature scaling before return

        Returns:
            Tensor (N, num_classes) — logits or calibrated logits
        """
        feat = self.features(x)
        pooled = self.pool(feat)
        flat = torch.flatten(pooled, 1)
        logits = self.classifier(flat)

        if return_calibrated:
            return logits / self.temperature.clamp(min=0.1)
        return logits

    def predict(self, x: torch.Tensor, min_confidence: float = 0.72) -> dict:
        """
        High-level predict that enforces the UNKNOWN_ABNORMALITY fallback.

        Returns:
            {
              "class_index": int,
              "class_name": str,
              "confidence": float,
              "is_unknown": bool,
              "all_probs": list[float]
            }
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(x, return_calibrated=True)
            probs = torch.softmax(logits, dim=1)
            max_prob, max_idx = probs.max(dim=1)

        prob_val = float(max_prob[0])
        class_idx = int(max_idx[0])
        class_name = self.class_names[class_idx] if class_idx < len(self.class_names) else "UNKNOWN_ABNORMALITY"

        # CRITICAL: Never return a specific diagnosis below confidence threshold
        if prob_val < min_confidence:
            return {
                "class_index": -1,
                "class_name": "UNKNOWN_ABNORMALITY",
                "confidence": prob_val,
                "is_unknown": True,
                "all_probs": probs[0].tolist()
            }

        return {
            "class_index": class_idx,
            "class_name": class_name,
            "confidence": prob_val,
            "is_unknown": False,
            "all_probs": probs[0].tolist()
        }


def build_disease_classifier(num_classes: int | None = None,
                              pretrained: bool = True,
                              class_names: list | None = None) -> DiseaseClassifier:
    """Factory function for DiseaseClassifier."""
    return DiseaseClassifier(
        num_classes=num_classes,
        pretrained=pretrained,
        class_names=class_names
    )
