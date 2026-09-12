"""
Model D: Agricultural Pest Detector
Specialized lightweight model trained to detect visible insects, larvae, egg clusters, and webbing.
Classes: ['pest_visible', 'pest_not_visible', 'possible_pest_damage', 'uncertain']
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

class PestDetector(nn.Module):
    def __init__(self, num_classes=4, pretrained=True):
        super(PestDetector, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = mobilenet_v3_small(weights=weights)
        
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        
        # High-sensitivity classification head with calibrated thresholding
        self.classifier = nn.Sequential(
            nn.Linear(576, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, 128),
            nn.Hardswish(),
            nn.Linear(128, num_classes)
        )
        
        # Auxiliary pest presence confidence score (binary gate: insect visible vs not)
        self.insect_presence_gate = nn.Sequential(
            nn.Linear(576, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        feat = self.features(x)
        p = self.pool(feat)
        flat = torch.flatten(p, 1)
        class_logits = self.classifier(flat)
        insect_gate = self.insect_presence_gate(flat)
        return class_logits, insect_gate

def build_pest_detector(pretrained=True):
    return PestDetector(num_classes=4, pretrained=pretrained)
