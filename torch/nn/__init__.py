"""
torch.nn shim module.
"""
from typing import Any, Tuple, Union, Sequence

class Module:
    def __init__(self, *args, **kwargs):
        pass
    def __call__(self, *args, **kwargs) -> Any:
        return self.forward(*args, **kwargs)
    def forward(self, *args, **kwargs) -> Any:
        return None
    def to(self, device: Any) -> "Module":
        return self
    def eval(self) -> "Module":
        return self
    def train(self, mode: bool = True) -> "Module":
        return self
    def parameters(self):
        return []
    def state_dict(self):
        return {}
    def load_state_dict(self, state_dict: Any, strict: bool = True):
        pass

class Sequential(Module):
    def __init__(self, *args):
        super().__init__()
        self.modules_list = list(args)
    def forward(self, x: Any) -> Any:
        for m in self.modules_list:
            if callable(m):
                x = m(x)
        return x

class Conv2d(Module):
    def __init__(self, in_channels: int, out_channels: int, kernel_size: Any, stride: int = 1, padding: int = 0, bias: bool = True):
        super().__init__()

class BatchNorm2d(Module):
    def __init__(self, num_features: int):
        super().__init__()

class Hardswish(Module):
    def __init__(self, inplace: bool = False):
        super().__init__()

class ReLU(Module):
    def __init__(self, inplace: bool = False):
        super().__init__()

class AdaptiveAvgPool2d(Module):
    def __init__(self, output_size: Any):
        super().__init__()

class Flatten(Module):
    def __init__(self, start_dim: int = 1, end_dim: int = -1):
        super().__init__()

class Linear(Module):
    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()

class Dropout(Module):
    def __init__(self, p: float = 0.5, inplace: bool = False):
        super().__init__()

class Sigmoid(Module):
    def __init__(self):
        super().__init__()

class Softmax(Module):
    def __init__(self, dim: int | None = None):
        super().__init__()

class CrossEntropyLoss(Module):
    def __init__(self, *args, **kwargs):
        super().__init__()

class BCEWithLogitsLoss(Module):
    def __init__(self, *args, **kwargs):
        super().__init__()
