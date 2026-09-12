"""
Model C: Physical Damage Detector & Segmenter
Detects visible mechanical damage, torn sections, holes, snapped petioles, and edge chewing.
Classes: ['intact', 'torn', 'broken', 'hole_damage', 'damaged_edge', 'uncertain']
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

class DamageDetector(nn.Module):
    def __init__(self, num_classes=6, pretrained=True):
        super(DamageDetector, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = mobilenet_v3_small(weights=weights)
        
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        
        # Classification head for structural damage category
        self.classifier = nn.Sequential(
            nn.Linear(576, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes)
        )
        
        # Low-resolution damage segmentation mask head (28x28 spatial grid)
        self.mask_head = nn.Sequential(
            nn.Conv2d(576, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.ConvTranspose2d(128, 32, kernel_size=4, stride=2, padding=1), # upsample to 14x14
            nn.ReLU(),
            nn.ConvTranspose2d(32, 1, kernel_size=4, stride=2, padding=1),  # upsample to 28x28
            nn.Sigmoid()
        )

    def forward(self, x):
        feat = self.features(x)
        p = self.pool(feat)
        flat = torch.flatten(p, 1)
        damage_logits = self.classifier(flat)
        damage_mask = self.mask_head(feat)
        return damage_logits, damage_mask

def build_damage_detector(pretrained=True):
    return DamageDetector(num_classes=6, pretrained=pretrained)
