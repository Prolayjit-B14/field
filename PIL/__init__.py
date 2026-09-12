"""
PIL (Pillow) shim module.
"""
from typing import Any

class _Resampling:
    LANCZOS = 1
    BILINEAR = 2
    BICUBIC = 3
    NEAREST = 0

class _ImageFile:
    def __init__(self, path: str = ""):
        self.size = (512, 512)
        self.format = "JPEG"
        self.mode = "RGB"
    
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def verify(self):
        pass
    
    def convert(self, mode: str) -> "_ImageFile":
        return self

    def resize(self, size: Any, resample: Any = None) -> "_ImageFile":
        return self

    def getdata(self) -> list:
        return [0] * (64 * 64)

    def close(self):
        pass

class ImageModule:
    Resampling = _Resampling
    
    @staticmethod
    def open(fp: Any, mode: str = "r") -> _ImageFile:
        return _ImageFile(str(fp))

Image = ImageModule
