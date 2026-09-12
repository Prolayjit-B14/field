"""
Model A: Plant & Leaf Detector
Lightweight mobile object detection architecture based on MobileNetV3 backbone
with multi-scale SSD detection heads for isolating leaf bounding boxes.
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

class PlantLeafDetector(nn.Module):
    def __init__(self, num_classes=3, pretrained=True):
        """
        Classes: ['plant', 'leaf', 'background']
        """
        super(PlantLeafDetector, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        backbone = mobilenet_v3_small(weights=weights)
        
        # Feature extractor layers from MobileNetV3
        self.features = backbone.features
        
        # Detection heads for bounding boxes and class logits
        # Feature map channel reduction
        self.head_conv = nn.Sequential(
            nn.Conv2d(576, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.Hardswish(),
            nn.AdaptiveAvgPool2d((7, 7))
        )
        
        # Classification head (background, leaf, plant)
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 7 * 7, 256),
            nn.Hardswish(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes)
        )
        
        # Regression head for normalized bbox coordinates (cx, cy, w, h)
        self.bbox_regressor = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 7 * 7, 128),
            nn.Hardswish(),
            nn.Linear(128, 4),
            nn.Sigmoid() # Coordinates normalized in [0, 1]
        )

    def forward(self, x):
        feat = self.features(x)
        h = self.head_conv(feat)
        class_logits = self.classifier(h)
        bbox_coords = self.bbox_regressor(h)
        return class_logits, bbox_coords

def build_plant_detector(pretrained=True):
    return PlantLeafDetector(num_classes=3, pretrained=pretrained)
