"""
Model B: Leaf Condition Classifier
Lightweight CNN with temperature calibration layer.
Input: Cropped leaf ROI (224x224)
Outputs: ['healthy', 'abnormal', 'uncertain']
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

class LeafConditionClassifier(nn.Module):
    def __init__(self, num_classes=3, pretrained=True):
        super(LeafConditionClassifier, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = mobilenet_v3_small(weights=weights)
        
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        
        # Classification head with dropout to prevent overfitting
        self.classifier = nn.Sequential(
            nn.Linear(576, 128),
            nn.Hardswish(),
            nn.Dropout(p=0.25),
            nn.Linear(128, num_classes)
        )
        
        # Learnable temperature parameter for probability calibration
        self.temperature = nn.Parameter(torch.ones(1) * 1.2)

    def forward(self, x, return_calibrated=True):
        f = self.features(x)
        p = self.pool(f)
        flattened = torch.flatten(p, 1)
        logits = self.classifier(flattened)
        
        if return_calibrated:
            calibrated_logits = logits / self.temperature
            return calibrated_logits
        return logits

def build_condition_classifier(pretrained=True):
    return LeafConditionClassifier(num_classes=3, pretrained=pretrained)
