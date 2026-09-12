"""
torch.optim shim module.
"""
from typing import Any

class Optimizer:
    def __init__(self, params: Any, lr: float = 1e-3, **kwargs):
        self.param_groups = [{"lr": lr}]
    def step(self):
        pass
    def zero_grad(self):
        pass

class AdamW(Optimizer):
    pass

class SGD(Optimizer):
    pass

class lr_scheduler:
    class CosineAnnealingLR:
        def __init__(self, optimizer: Any, T_max: int, **kwargs):
            pass
        def step(self):
            pass
