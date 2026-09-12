"""
Model E: Color & Visual Health Condition Classifier
Combines deep CNN spatial features with color-space statistical moments (HSV + CIELAB)
to distinguish normal green foliage from senescence, chlorosis, and necrosis.
Classes: ['normal_green', 'yellowing', 'browning', 'abnormal_discoloration', 'uncertain']
"""

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

class ColorConditionClassifier(nn.Module):
    def __init__(self, num_classes=5, pretrained=True, color_stat_dim=12):
        super(ColorConditionClassifier, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = mobilenet_v3_small(weights=weights)
        
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        
        # Color statistics projection layer (HSV mean, std, skewness, Lab mean/std)
        self.color_stat_encoder = nn.Sequential(
            nn.Linear(color_stat_dim, 32),
            nn.ReLU()
        )
        
        # Combined fusion classifier
        self.fusion_classifier = nn.Sequential(
            nn.Linear(576 + 32, 128),
            nn.Hardswish(),
            nn.Dropout(p=0.25),
            nn.Linear(128, num_classes)
        )

    def forward(self, x, color_stats=None):
        feat = self.features(x)
        p = self.pool(feat)
        flat_cnn = torch.flatten(p, 1)
        
        if color_stats is None:
            # Fallback zero vector if raw color moments not provided
            color_stats = torch.zeros((x.size(0), 12), device=x.device)
            
        color_embed = self.color_stat_encoder(color_stats)
        fused = torch.cat([flat_cnn, color_embed], dim=1)
        logits = self.fusion_classifier(fused)
        return logits

def build_color_classifier(pretrained=True):
    return ColorConditionClassifier(num_classes=5, pretrained=pretrained)
