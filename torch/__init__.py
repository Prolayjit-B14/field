"""
PyTorch shim and stub package.
Provides classes and functions for mobile plant vision neural network definitions.
"""
from typing import Any, Optional, Union, Sequence

class Tensor:
    def __init__(self, *args, **kwargs):
        pass
    def to(self, device: Any) -> "Tensor":
        return self
    def cpu(self) -> "Tensor":
        return self
    def numpy(self) -> Any:
        return []
    def unsqueeze(self, dim: int) -> "Tensor":
        return self

def tensor(data: Any, dtype: Any = None, device: Any = None) -> Tensor:
    return Tensor()

def from_numpy(ndarray: Any) -> Tensor:
    return Tensor()

def FloatTensor(*args, **kwargs) -> Tensor:
    return Tensor()

def zeros(*args, **kwargs) -> Tensor:
    return Tensor()

def ones(*args, **kwargs) -> Tensor:
    return Tensor()

def randn(*args, **kwargs) -> Tensor:
    return Tensor()

class _Onnx:
    @staticmethod
    def export(*args, **kwargs):
        pass

onnx = _Onnx()

class device:
    def __init__(self, type_or_str: str):
        self.type = str(type_or_str)

class _Cuda:
    @staticmethod
    def is_available() -> bool:
        return False

cuda = _Cuda()

class no_grad:
    def __enter__(self):
        return None
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

def save(obj: Any, f: Any, **kwargs):
    pass

def load(f: Any, map_location: Any = None, **kwargs) -> Any:
    return {}

from . import nn
from . import utils
from . import optim
