"""
OpenCV (cv2) fallback shim.
Provides standard constants and functions used in vision pipelines.
"""
from typing import Any

COLOR_BGR2GRAY = 6
COLOR_BGR2HSV = 40
COLOR_RGB2BGR = 4
CV_64F = 6

def imread(filename: str, flags: int = 1) -> Any:
    return None

def imwrite(filename: str, img: Any, params: Any = None) -> bool:
    return True

def cvtColor(src: Any, code: int) -> Any:
    return src

def Laplacian(src: Any, ddepth: int) -> Any:
    return src

def meanStdDev(src: Any) -> Any:
    return (0.0,), (0.0,)

def inRange(src: Any, lowerb: Any, upperb: Any) -> Any:
    return src

def countNonZero(src: Any) -> int:
    return 0

def resize(src: Any, dsize: Any, fx: float = 1.0, fy: float = 1.0, interpolation: int = 1) -> Any:
    return src
