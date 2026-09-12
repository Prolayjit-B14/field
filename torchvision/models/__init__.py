"""
torchvision.models module.
"""
from typing import Any
import torch.nn as nn

class _Weights:
    DEFAULT = "DEFAULT"

MobileNet_V3_Small_Weights = _Weights

class _Backbone(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.Hardswish(),
            nn.AdaptiveAvgPool2d((7, 7)),
            nn.Conv2d(16, 576, kernel_size=1)
        )

def mobilenet_v3_small(weights: Any = None, **kwargs) -> _Backbone:
    return _Backbone()
