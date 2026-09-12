"""
ONNX Leaf Edge Detector
=======================
Runtime wrapper for sih_crop_edge_model.onnx — the leaf detection and segmentation model
trained for the Smart India Hackathon (SIH) agricultural vision system.

Design principles:
- AUTO-INTROSPECTS input name, shape, dtype at load time (no hardcoded assumptions)
- Handles both segmentation mask output and bounding-box regression output
- CLAHE illumination normalization before inference (lighting-robust)
- Returns a structured result dict with leaf_detected, bbox, confidence, leaf_mask
- Graceful degradation: if onnxruntime is not installed, returns not_available sentinel
- Does NOT use HSV color thresholds to detect leaves

Output types detected at load time:
  Case A: Segmentation mask (H×W sigmoid output) — computes tight bbox from mask
  Case B: Bbox + confidence output (4+1 values) — decodes normalized coords
"""

import sys
import logging
from pathlib import Path
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import ONNX_MODEL_PATH, load_thresholds_config

logger = logging.getLogger("ONNXLeafEdgeDetector")

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logger.warning("onnxruntime not installed. Leaf detector will be unavailable.")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class ONNXLeafEdgeDetector:
    """
    Wraps sih_crop_edge_model.onnx for leaf detection and segmentation.
    Auto-introspects model input/output at construction time.
    """

    def __init__(self, model_path: Path | None = None, thresholds: dict | None = None):
        self.model_path = model_path or ONNX_MODEL_PATH
        self.thresholds = thresholds or load_thresholds_config().get("onnx_leaf_detector", {})
        self.mask_threshold = float(self.thresholds.get("mask_binary_threshold", 0.50))
        self.min_leaf_confidence = float(self.thresholds.get("min_leaf_confidence", 0.40))
        self.min_bbox_area_ratio = float(self.thresholds.get("min_bbox_area_ratio", 0.10))

        self.session = None
        self.input_name = None
        self.input_shape = None   # (N, C, H, W) or (N, H, W, C)
        self.input_h = 224
        self.input_w = 224
        self.output_type = "unknown"  # "mask" or "bbox"
        self.output_names = []
        self.model_info = {}
        self.available = False

        self._load_model()

    def _load_model(self):
        """Loads the ONNX session and introspects input/output shapes."""
        if not ONNX_AVAILABLE:
            self.model_info = {"status": "onnxruntime_unavailable"}
            return

        model_path = Path(self.model_path)
        if not model_path.exists():
            logger.warning("ONNX model not found at %s", model_path)
            self.model_info = {"status": "model_file_missing", "path": str(model_path)}
            return

        try:
            sess_options = ort.SessionOptions()
            sess_options.log_severity_level = 3  # suppress verbose logs
            self.session = ort.InferenceSession(
                str(model_path),
                sess_options=sess_options,
                providers=["CPUExecutionProvider"]
            )

            # ── Introspect inputs ─────────────────────────────────────────
            inputs = self.session.get_inputs()
            self.input_name = inputs[0].name
            self.input_shape = inputs[0].shape  # e.g. [1, 3, 224, 224] or [None, 3, H, W]

            # Resolve spatial dimensions (handle dynamic axes = None or 0)
            if len(self.input_shape) == 4:
                h = self.input_shape[2]
                w = self.input_shape[3]
                self.input_h = h if isinstance(h, int) and h > 0 else 224
                self.input_w = w if isinstance(w, int) and w > 0 else 224
            else:
                self.input_h, self.input_w = 224, 224

            # ── Introspect outputs ────────────────────────────────────────
            outputs = self.session.get_outputs()
            self.output_names = [o.name for o in outputs]
            first_output_shape = outputs[0].shape

            # Determine output type: mask (H×W) or bbox (4/5 values)
            total_out_dims = len(first_output_shape)
            if total_out_dims >= 3:
                self.output_type = "mask"
            elif total_out_dims == 2:
                out_size = first_output_shape[-1]
                self.output_type = "bbox" if isinstance(out_size, int) and out_size <= 6 else "mask"
            else:
                self.output_type = "mask"  # safe default

            self.model_info = {
                "status": "loaded",
                "model_path": str(model_path),
                "input_name": self.input_name,
                "input_shape": list(self.input_shape),
                "input_hw": [self.input_h, self.input_w],
                "output_names": self.output_names,
                "output_type": self.output_type,
                "file_size_kb": round(model_path.stat().st_size / 1024, 1)
            }
            self.available = True
            logger.info("ONNX Leaf Detector loaded: %s | output_type=%s | input=%dx%d",
                        model_path.name, self.output_type, self.input_h, self.input_w)

        except Exception as exc:
            logger.error("Failed to load ONNX model: %s", exc)
            self.model_info = {"status": "load_failed", "error": str(exc)}

    def _preprocess(self, bgr_image: np.ndarray) -> np.ndarray:
        """
        Preprocesses a BGR OpenCV image for ONNX inference.
        Steps: CLAHE → resize → RGB → normalize (ImageNet) → NCHW float32
        """
        if not CV2_AVAILABLE:
            # Fallback: create a synthetic tensor of zeros
            return np.zeros((1, 3, self.input_h, self.input_w), dtype=np.float32)

        # 1. CLAHE illumination normalization on L channel (lighting-robust)
        lab = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        img_normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        # 2. Resize to model input size
        img_resized = cv2.resize(img_normalized, (self.input_w, self.input_h),
                                 interpolation=cv2.INTER_LINEAR)

        # 3. BGR → RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

        # 4. Normalize with ImageNet mean/std
        img_float = img_rgb.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_float = (img_float - mean) / std

        # 5. HWC → NCHW
        img_nchw = np.transpose(img_float, (2, 0, 1))[np.newaxis, ...]
        return img_nchw.astype(np.float32)

    def _postprocess_mask(self, raw_output: np.ndarray, original_h: int, original_w: int):
        """
        Postprocesses a segmentation mask output.
        Returns: leaf_mask (H×W bool at original resolution), bbox (normalized), confidence.
        """
        if not CV2_AVAILABLE:
            return None, None, 0.0

        # raw_output shape: (1, 1, H, W) or (1, H, W) or (H, W)
        mask = raw_output.squeeze()
        # Apply sigmoid if values are outside [0, 1]
        if mask.max() > 1.0 or mask.min() < 0.0:
            mask = 1.0 / (1.0 + np.exp(-mask))

        binary_mask = (mask >= self.mask_threshold).astype(np.uint8)

        # Resize back to original image dimensions
        mask_resized = cv2.resize(binary_mask.astype(np.float32),
                                  (original_w, original_h),
                                  interpolation=cv2.INTER_NEAREST)
        mask_bool = mask_resized > 0.5

        leaf_pixel_ratio = float(mask_bool.sum()) / max(original_h * original_w, 1)
        confidence = min(1.0, leaf_pixel_ratio * 3.0)  # rough proxy

        if leaf_pixel_ratio < self.thresholds.get("min_mask_coverage_ratio", 0.08):
            return mask_bool, None, confidence

        # Compute tight bounding box from connected components
        contours, _ = cv2.findContours(mask_resized.astype(np.uint8),
                                        cv2.RETR_EXTERNAL,
                                        cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask_bool, None, confidence

        # Use the largest contour
        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)

        # Pad bbox slightly for context
        pad = 0.02
        x_min = max(0.0, (x / original_w) - pad)
        y_min = max(0.0, (y / original_h) - pad)
        x_max = min(1.0, ((x + w) / original_w) + pad)
        y_max = min(1.0, ((y + h) / original_h) + pad)

        # Normalize bbox: [x_min, y_min, width, height]
        bbox = [
            round(x_min, 4),
            round(y_min, 4),
            round(x_max - x_min, 4),
            round(y_max - y_min, 4)
        ]

        bbox_area = bbox[2] * bbox[3]
        if bbox_area < self.min_bbox_area_ratio:
            return mask_bool, None, confidence

        return mask_bool, bbox, confidence

    def _postprocess_bbox(self, raw_output: np.ndarray):
        """
        Postprocesses a bbox regression output.
        Expected format: (1, 4) or (1, 5) — [cx, cy, w, h] or [cx, cy, w, h, conf]
        Returns: None mask, bbox [x,y,w,h] normalized, confidence float.
        """
        coords = raw_output.squeeze()
        if len(coords) >= 5:
            cx, cy, w, h, conf = float(coords[0]), float(coords[1]), float(coords[2]), float(coords[3]), float(coords[4])
        elif len(coords) == 4:
            cx, cy, w, h = float(coords[0]), float(coords[1]), float(coords[2]), float(coords[3])
            conf = 0.70  # assume present if model output is bbox-only
        else:
            return None, None, 0.0

        # Convert center format → x_min, y_min, w, h
        x_min = max(0.0, cx - w / 2)
        y_min = max(0.0, cy - h / 2)
        bbox = [round(x_min, 4), round(y_min, 4), round(w, 4), round(h, 4)]

        if (bbox[2] * bbox[3]) < self.min_bbox_area_ratio:
            return None, None, conf

        return None, bbox, conf

    def detect(self, bgr_image: np.ndarray) -> dict:
        """
        Main detection entry point.

        Args:
            bgr_image: OpenCV BGR numpy array (H×W×3).

        Returns:
            {
              "leaf_detected": bool,
              "bbox": [x_min, y_min, width, height] normalized or None,
              "confidence": float [0-1],
              "leaf_mask": np.ndarray bool H×W or None,
              "output_type": str,
              "reason": str (if not detected)
            }
        """
        if not self.available:
            return {
                "leaf_detected": False,
                "bbox": None,
                "confidence": 0.0,
                "leaf_mask": None,
                "output_type": "unavailable",
                "reason": self.model_info.get("status", "onnxruntime_unavailable")
            }

        original_h, original_w = bgr_image.shape[:2]
        input_tensor = self._preprocess(bgr_image)

        if self.session is None:
            return {
                "leaf_detected": False, "bbox": None, "confidence": 0.0,
                "leaf_mask": None, "output_type": self.output_type,
                "reason": "session_not_loaded"
            }
        try:
            outputs = self.session.run(self.output_names, {self.input_name: input_tensor})
        except Exception as exc:
            logger.error("ONNX inference failed: %s", exc)
            return {
                "leaf_detected": False,
                "bbox": None,
                "confidence": 0.0,
                "leaf_mask": None,
                "output_type": self.output_type,
                "reason": f"inference_error: {exc}"
            }

        raw_output = outputs[0]

        if self.output_type == "mask":
            leaf_mask, bbox, confidence = self._postprocess_mask(raw_output, original_h, original_w)
        else:
            leaf_mask, bbox, confidence = self._postprocess_bbox(raw_output)

        leaf_detected = (bbox is not None) and (confidence >= self.min_leaf_confidence)

        return {
            "leaf_detected": leaf_detected,
            "bbox": bbox,
            "confidence": round(confidence, 4),
            "leaf_mask": leaf_mask,
            "output_type": self.output_type,
            "reason": None if leaf_detected else "confidence_below_threshold"
        }


if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.INFO)
    detector = ONNXLeafEdgeDetector()
    print(json.dumps({k: v for k, v in detector.model_info.items() if k != "leaf_mask"}, indent=2))
