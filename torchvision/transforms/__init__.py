"""
torchvision.transforms module.
"""
from typing import Any, Sequence

class Transform:
    def __call__(self, img: Any) -> Any:
        return img

class Compose(Transform):
    def __init__(self, transforms: Sequence[Any]):
        self.transforms = transforms
    def __call__(self, img: Any) -> Any:
        for t in self.transforms:
            img = t(img)
        return img

class Resize(Transform):
    def __init__(self, size: Any):
        self.size = size

class ToTensor(Transform):
    pass

class Normalize(Transform):
    def __init__(self, mean: Sequence[float], std: Sequence[float]):
        self.mean = mean
        self.std = std

class RandomHorizontalFlip(Transform):
    def __init__(self, p: float = 0.5):
        self.p = p

class RandomRotation(Transform):
    def __init__(self, degrees: Any):
        self.degrees = degrees

class ColorJitter(Transform):
    def __init__(self, brightness: float = 0, contrast: float = 0, saturation: float = 0, hue: float = 0):
        pass
