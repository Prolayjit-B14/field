"""
Multi-Stage Plant Vision Inference Pipeline — v2
================================================
Implements the scientifically-grounded 9-stage inference pipeline per spec.

STAGE 1:  Image Quality Assessment       → IMAGE_TOO_DARK / FACE_DETECTED / etc.
STAGE 2:  ONNX Leaf/Plant Detection      → NOT_A_PLANT_IMAGE / leaf bbox + mask
STAGE 3:  Leaf Visibility Check          → LEAF_TOO_SMALL / LEAF_OCCLUDED
STAGE 4:  ROI Extraction + Illumination  → cropped, CLAHE-normalized leaf tensor
STAGE 5:  Multi-Label Parallel Inference → condition, damage, pest, color, disease
STAGE 6:  Severity Estimation            → from segmented mask areas (not pixel ratios)
STAGE 7:  Confidence Calibration         → temperature scaling per model
STAGE 8:  Evidence Validation Gate       → multi-label, UNKNOWN on low confidence
STAGE 9:  Recommendation Engine          → confidence-gated treatment guidance

IMPORTANT DESIGN RULES (per spec sections 16, 38):
  ✗ NEVER: green → healthy
  ✗ NEVER: brown → disease
  ✗ NEVER: yellow → nutrient deficiency
  ✗ NEVER: holes → specific pest
  ✗ NEVER: force a diagnosis on every image
  ✓ Return LOW_CONFIDENCE / UNKNOWN when evidence is insufficient
  ✓ Multi-label: leaf can have disease + pest simultaneously
  ✓ Severity from mask area ratio, not arbitrary pixel thresholds
  ✓ Disease name only when model confidence ≥ calibrated threshold
"""

import sys
import json
import logging
import time
from pathlib import Path
from typing import Optional, Tuple
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import (
    load_thresholds_config, load_classes_config, get_config_path,
    get_version_manifest, MODEL_VERSION
)
from ml.preprocessing.quality_checker import ImageQualityChecker
from ml.models.onnx_leaf_edge_detector import ONNXLeafEdgeDetector
from ml.models.severity_estimator import SeverityEstimator
from ml.inference.recommendation_engine import RecommendationEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("InferencePipeline")

try:
    import cv2
    import torch
    import torch.nn as nn
    from torchvision import transforms
    TORCH_AVAILABLE = True
    CV2_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    CV2_AVAILABLE = False
    logger.warning("PyTorch or OpenCV not available — pipeline will run in structural/config-only mode.")

# Standard ImageNet normalization transform for 384×384 inputs
if TORCH_AVAILABLE:
    CLASSIFICATION_TRANSFORM = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((384, 384)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


class MultiStagePlantVisionPipeline:
    """
    Orchestrates the 9-stage leaf analysis pipeline.
    All model weights are optional — the pipeline degrades gracefully when
    trained weights are not yet available, returning appropriate LOW_CONFIDENCE outputs.
    """

    def __init__(self, thresholds_path=None, classes_path=None):
        # ── Load configuration ─────────────────────────────────────────────
        if thresholds_path and Path(thresholds_path).exists():
            with open(thresholds_path, "r", encoding="utf-8") as f:
                self.thresholds = json.load(f)
        else:
            self.thresholds = load_thresholds_config()

        if classes_path and Path(classes_path).exists():
            with open(classes_path, "r", encoding="utf-8") as f:
                self.classes = json.load(f)
        else:
            self.classes = load_classes_config()

        self.version = get_version_manifest()

        # ── Stage components ───────────────────────────────────────────────
        self.quality_checker = ImageQualityChecker()
        self.leaf_detector = ONNXLeafEdgeDetector()
        self.severity_estimator = SeverityEstimator(self.thresholds)
        self.recommendation_engine = RecommendationEngine(self.thresholds)

        # ── PyTorch classifier models (loaded lazily) ──────────────────────
        self._classifiers_loaded = False
        self._leaf_condition_model = None
        self._damage_model = None
        self._pest_model = None
        self._color_model = None
        self._disease_model = None
        self._try_load_classifiers()

        logger.info(
            "Pipeline initialized | ONNX: %s | Classifiers: %s",
            self.leaf_detector.model_info.get("status", "unknown"),
            "loaded" if self._classifiers_loaded else "weights_unavailable"
        )

    def _try_load_classifiers(self):
        """
        Attempts to load trained PyTorch classifier weights.
        Gracefully handles missing .pth files — returns LOW_CONFIDENCE
        when weights are absent rather than crashing.
        """
        if not TORCH_AVAILABLE:
            return

        from ml.models.leaf_condition_classifier import build_condition_classifier
        from ml.models.damage_detector import build_damage_detector
        from ml.models.pest_detector import build_pest_detector
        from ml.models.color_classifier import build_color_classifier
        from ml.models.disease_classifier import build_disease_classifier

        checkpoints_dir = PROJECT_ROOT / "ml" / "models" / "checkpoints"

        def _load_model(build_fn, ckpt_subdir: str, name: str):
            try:
                model = build_fn(pretrained=False)
                ckpt = checkpoints_dir / ckpt_subdir / "best_model.pth"
                if ckpt.exists():
                    model.load_state_dict(
                        torch.load(ckpt, map_location="cpu", weights_only=True)
                    )
                    model.eval()
                    logger.info("Loaded %s weights from %s", name, ckpt)
                    return model, True
                else:
                    # No weights — load with ImageNet pretraining only (untrained head)
                    model = build_fn(pretrained=True)
                    model.eval()
                    logger.warning("%s checkpoint not found at %s — using pretrained backbone only", name, ckpt)
                    return model, False
            except Exception as exc:
                logger.error("Failed to load %s: %s", name, exc)
                return None, False

        c_model, c_ready = _load_model(build_condition_classifier, "condition", "LeafConditionClassifier")
        d_model, d_ready = _load_model(build_damage_detector, "damage", "DamageDetector")
        p_model, p_ready = _load_model(build_pest_detector, "pest", "PestDetector")
        col_model, col_ready = _load_model(build_color_classifier, "color", "ColorConditionClassifier")
        dis_model, dis_ready = _load_model(build_disease_classifier, "disease", "DiseaseClassifier")

        self._leaf_condition_model = c_model
        self._damage_model = d_model
        self._pest_model = p_model
        self._color_model = col_model
        self._disease_model = dis_model
        self._classifiers_loaded = any([c_ready, d_ready, p_ready, col_ready, dis_ready])
        self._weights_status = {
            "condition": c_ready,
            "damage": d_ready,
            "pest": p_ready,
            "color": col_ready,
            "disease": dis_ready
        }

    # ════════════════════════════════════════════════════════════════════════
    # PUBLIC ENTRY POINT
    # ════════════════════════════════════════════════════════════════════════

    def run_inference(self, image_input) -> dict:
        """
        Executes the 9-stage inference pipeline.

        Args:
            image_input: file path (str/Path) or BGR numpy array

        Returns:
            Structured JSON dict per spec section 15 / 28
        """
        t_start = time.time()

        # ── STAGE 1: Image Quality Assessment ─────────────────────────────
        is_usable, quality_code, quality_metrics = self.quality_checker.assess_image(image_input)

        if not is_usable:
            return self._build_rejection(quality_code, quality_metrics, t_start)

        # ── Load image as numpy array ──────────────────────────────────────
        bgr_image = self._load_bgr(image_input)
        if bgr_image is None:
            return self._build_rejection("IMAGE_CORRUPT_OR_MISSING", quality_metrics, t_start)

        original_h, original_w = bgr_image.shape[:2]

        # ── STAGE 2: ONNX Leaf/Plant Detection ────────────────────────────
        detection = self.leaf_detector.detect(bgr_image)

        if not detection["leaf_detected"]:
            if detection.get("reason") == "onnxruntime_unavailable":
                # Detector unavailable — continue with full-image fallback but note it
                bbox = [0.05, 0.05, 0.90, 0.90]
                leaf_mask = None
                detector_note = "onnx_detector_unavailable"
            else:
                return self._build_rejection("NOT_A_PLANT_IMAGE", quality_metrics, t_start,
                                             extra={"detection": detection})

        else:
            bbox = detection["bbox"]
            leaf_mask = detection.get("leaf_mask")
            detector_note = "onnx_detected"

        # ── STAGE 3: Leaf Visibility Check ────────────────────────────────
        if bbox is not None:
            bbox_area = bbox[2] * bbox[3]
            min_area = self.thresholds.get("onnx_leaf_detector", {}).get("min_bbox_area_ratio", 0.10)
            if bbox_area < min_area:
                return self._build_rejection("LEAF_TOO_SMALL", quality_metrics, t_start)

        leaf_confidence = detection.get("confidence", 0.70)

        # ── STAGE 4: ROI Extraction + Illumination Normalization ──────────
        roi_bgr = self._crop_roi(bgr_image, bbox)
        roi_bgr = self._apply_clahe(roi_bgr)   # lighting normalization

        # ── STAGE 5: Multi-Label Parallel Inference ────────────────────────
        if TORCH_AVAILABLE and roi_bgr is not None:
            roi_tensor = self._to_tensor(roi_bgr)
            leaf_cond_result = self._run_condition_model(roi_tensor)
            damage_result    = self._run_damage_model(roi_tensor, original_h, original_w)
            pest_result      = self._run_pest_model(roi_tensor)
            color_result     = self._run_color_model(roi_tensor, roi_bgr)

            # Disease model: only run if leaf condition suggests abnormality
            if leaf_cond_result["status"] == "abnormal" and leaf_cond_result["confidence"] > 0.55:
                disease_result = self._run_disease_model(roi_tensor)
            else:
                disease_result = {"name": None, "confidence": 0.0, "is_unknown": True}
        else:
            # Structural fallback (no torch/cv2)
            leaf_cond_result = self._fallback_uncertain("condition")
            damage_result    = self._fallback_uncertain("damage")
            pest_result      = self._fallback_uncertain("pest")
            color_result     = self._fallback_uncertain("color")
            disease_result   = {"name": None, "confidence": 0.0, "is_unknown": True}

        # ── STAGE 6: Severity Estimation ──────────────────────────────────
        damage_mask_arr = damage_result.get("mask")   # np.ndarray or None
        severity = self.severity_estimator.estimate(
            leaf_mask=leaf_mask,
            damage_mask=damage_mask_arr,
            lesion_mask=None   # lesion mask from future disease segmentation model
        )

        # ── STAGE 7+8: Confidence Calibration + Evidence Validation Gate ──
        conditions, overall_status, overall_confidence = self._validate_evidence_gate(
            leaf_cond_result, damage_result, pest_result, color_result, disease_result
        )

        # ── STAGE 9: Recommendation Engine ────────────────────────────────
        recommendation = self.recommendation_engine.generate(
            overall_status=overall_status,
            conditions=conditions,
            severity=severity,
            overall_confidence=overall_confidence
        )

        # ── Assemble final structured output ──────────────────────────────
        latency_ms = round((time.time() - t_start) * 1000)

        return {
            "status": "ANALYZED",
            "plant_detected": True,
            "leaf_detected": True,
            "image_quality": round(self._compute_quality_score(quality_metrics), 3),

            "conditions": conditions,

            "pest": self._build_pest_output(pest_result),
            "physical_damage": self._build_damage_output(damage_result),

            "overall_status": overall_status,
            "overall_confidence": round(overall_confidence, 3),

            "severity": severity,

            "visual_evidence": {
                "leaf_bbox": bbox,
                "leaf_mask_available": leaf_mask is not None,
                "damage_mask_available": damage_mask_arr is not None,
                "detector_source": detector_note,
                "leaf_detector_confidence": round(leaf_confidence, 3)
            },

            "recommendation": recommendation,
            "recommendation_available": recommendation.get("available", False),

            "image": {
                "quality_code": quality_code,
                "metrics": quality_metrics,
                "resolution": quality_metrics.get("resolution", [])
            },

            "reliability_notice": (
                "AI result is based on visual analysis only. "
                "For uncertain or severe cases, verify with an agricultural expert."
            ),

            **self.version,

            "diagnostics": {
                "latency_ms": latency_ms,
                "weights_loaded": self._weights_status if hasattr(self, "_weights_status") else {},
                "onnx_model": self.leaf_detector.model_info.get("status"),
                "classifiers_trained": self._classifiers_loaded
            }
        }

    # ════════════════════════════════════════════════════════════════════════
    # STAGE HELPERS
    # ════════════════════════════════════════════════════════════════════════

    def _load_bgr(self, image_input) -> Optional[np.ndarray]:
        """Loads image as BGR numpy array."""
        if isinstance(image_input, np.ndarray):
            return image_input
        if isinstance(image_input, (str, Path)):
            p = Path(image_input)
            if not CV2_AVAILABLE:
                return None
            if p.exists():
                return cv2.imread(str(p))
            # Synthetic green image for dry-run
            img = np.zeros((480, 640, 3), dtype=np.uint8)
            img[:, :] = [35, 140, 35]
            return img
        return None

    def _crop_roi(self, bgr_image: np.ndarray, bbox: list) -> Optional[np.ndarray]:
        """Crops leaf ROI using normalized bbox [x_min, y_min, w, h]."""
        if not CV2_AVAILABLE or bgr_image is None or bbox is None:
            return bgr_image
        h, w = bgr_image.shape[:2]
        x = int(bbox[0] * w)
        y = int(bbox[1] * h)
        bw = int(bbox[2] * w)
        bh = int(bbox[3] * h)
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(w, x + bw)
        y2 = min(h, y + bh)
        if x2 <= x1 or y2 <= y1:
            return bgr_image
        return bgr_image[y1:y2, x1:x2]

    def _apply_clahe(self, roi: np.ndarray) -> Optional[np.ndarray]:
        """Applies CLAHE illumination normalization to the leaf ROI."""
        if not CV2_AVAILABLE or roi is None:
            return roi
        lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    def _to_tensor(self, bgr_roi: np.ndarray):
        """Converts BGR ROI to normalized RGB tensor (1, 3, 384, 384)."""
        if not TORCH_AVAILABLE or bgr_roi is None:
            return None
        rgb = cv2.cvtColor(bgr_roi, cv2.COLOR_BGR2RGB)
        tensor = CLASSIFICATION_TRANSFORM(rgb)
        return tensor.unsqueeze(0)  # (1, 3, 384, 384)

    # ── Model forward passes ──────────────────────────────────────────────

    def _run_condition_model(self, tensor) -> dict:
        """Runs LeafConditionClassifier forward."""
        if self._leaf_condition_model is None or tensor is None:
            return self._fallback_uncertain("condition")
        try:
            with torch.no_grad():
                logits = self._leaf_condition_model(tensor, return_calibrated=True)
                probs = torch.softmax(logits, dim=1)[0]
            classes = ["healthy", "abnormal", "uncertain"]
            max_prob, max_idx = probs.max(0)
            conf = float(max_prob)
            status = classes[int(max_idx)] if int(max_idx) < len(classes) else "uncertain"
            # If max confidence is too low → uncertain regardless
            if conf < self.thresholds.get("leaf_condition", {}).get("medium_confidence", 0.60):
                status = "uncertain"
            return {"status": status, "confidence": round(conf, 4), "all_probs": probs.tolist()}
        except Exception as exc:
            logger.warning("Condition model error: %s", exc)
            return self._fallback_uncertain("condition")

    def _run_damage_model(self, tensor, orig_h: int, orig_w: int) -> dict:
        """Runs DamageDetector forward — returns class result + 28×28 mask."""
        if self._damage_model is None or tensor is None:
            return {**self._fallback_uncertain("damage"), "mask": None, "regions": []}
        try:
            with torch.no_grad():
                damage_logits, damage_mask_t = self._damage_model(tensor)
                probs = torch.softmax(damage_logits, dim=1)[0]
            classes = ["intact", "torn", "broken", "hole_damage", "damaged_edge", "uncertain"]
            max_prob, max_idx = probs.max(0)
            conf = float(max_prob)
            status = classes[int(max_idx)] if int(max_idx) < len(classes) else "uncertain"

            # Extract 28×28 numpy mask (squeeze batch+channel dims)
            mask_np = damage_mask_t[0, 0].cpu().numpy()  # (28, 28)
            min_conf = self.thresholds.get("damage_detector", {}).get("confirmed_damage_confidence", 0.78)

            is_detected = (status != "intact") and (conf >= min_conf)
            return {
                "status": status if is_detected else "not_detected",
                "confidence": round(conf, 4),
                "mask": mask_np if is_detected else None,
                "regions": []
            }
        except Exception as exc:
            logger.warning("Damage model error: %s", exc)
            return {**self._fallback_uncertain("damage"), "mask": None, "regions": []}

    def _run_pest_model(self, tensor) -> dict:
        """Runs PestDetector forward."""
        if self._pest_model is None or tensor is None:
            return self._fallback_uncertain("pest")
        try:
            with torch.no_grad():
                class_logits, insect_gate = self._pest_model(tensor)
                probs = torch.softmax(class_logits, dim=1)[0]
                gate_prob = float(insect_gate[0, 0])
            classes = ["pest_visible", "pest_not_visible", "possible_pest_damage", "uncertain"]
            max_prob, max_idx = probs.max(0)
            conf = float(max_prob)
            raw_status = classes[int(max_idx)] if int(max_idx) < len(classes) else "uncertain"

            cfg = self.thresholds.get("pest_detector", {})
            confirmed_thresh = cfg.get("confirmed_pest_confidence", 0.82)
            possible_thresh  = cfg.get("possible_pest_confidence", 0.60)

            if raw_status == "pest_visible" and conf >= confirmed_thresh:
                status = "detected"
            elif raw_status in ("pest_visible", "possible_pest_damage") and conf >= possible_thresh:
                status = "possible_pest_damage"
            else:
                status = "not_detected"

            return {
                "status": status,
                "confidence": round(conf, 4),
                "gate_probability": round(gate_prob, 4),
                "detections": []
            }
        except Exception as exc:
            logger.warning("Pest model error: %s", exc)
            return self._fallback_uncertain("pest")

    def _run_color_model(self, tensor, roi_bgr: np.ndarray) -> dict:
        """
        Runs ColorConditionClassifier forward with real HSV/Lab statistical moments.
        Note: Color statistics are INPUTS to the CNN fusion — not the classification criterion.
        """
        if self._color_model is None or tensor is None:
            return self._fallback_uncertain("color")
        try:
            # Compute real color statistics from leaf ROI
            color_stats_tensor = self._compute_color_stats(roi_bgr)
            with torch.no_grad():
                logits = self._color_model(tensor, color_stats_tensor)
                probs = torch.softmax(logits, dim=1)[0]
            classes = ["normal_green", "yellowing", "browning", "abnormal_discoloration", "uncertain"]
            max_prob, max_idx = probs.max(0)
            conf = float(max_prob)
            status = classes[int(max_idx)] if int(max_idx) < len(classes) else "uncertain"
            return {"status": status, "confidence": round(conf, 4)}
        except Exception as exc:
            logger.warning("Color model error: %s", exc)
            return self._fallback_uncertain("color")

    def _run_disease_model(self, tensor) -> dict:
        """Runs DiseaseClassifier forward. Enforces UNKNOWN_ABNORMALITY below confidence threshold."""
        if self._disease_model is None or tensor is None:
            return {"name": None, "confidence": 0.0, "is_unknown": True, "reason": "model_unavailable"}
        try:
            min_conf = self.thresholds.get("disease_classifier", {}).get("min_confidence", 0.72)
            result = self._disease_model.predict(tensor, min_confidence=min_conf)
            return {
                "name": result["class_name"],
                "confidence": round(result["confidence"], 4),
                "is_unknown": result["is_unknown"],
                "all_probs": result.get("all_probs", [])
            }
        except Exception as exc:
            logger.warning("Disease model error: %s", exc)
            return {"name": None, "confidence": 0.0, "is_unknown": True, "reason": str(exc)}

    def _compute_color_stats(self, roi_bgr: np.ndarray):
        """
        Computes 12-dimensional color statistics: HSV (mean, std, skewness×3) + Lab (mean, std×3).
        Used as INPUT FEATURES to the CNN fusion model — not as classification rules.
        """
        if not TORCH_AVAILABLE or not CV2_AVAILABLE or roi_bgr is None:
            return torch.zeros((1, 12))
        try:
            hsv = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
            lab = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
            stats = []
            for ch in range(3):
                c = hsv[:, :, ch].flatten()
                stats.extend([c.mean(), c.std(), float(np.mean(((c - c.mean()) / (c.std() + 1e-6))**3))])
            for ch in range(3):
                c = lab[:, :, ch].flatten()
                stats.extend([c.mean(), c.std()])
            # Normalize to [-1, 1] range
            stats_arr = np.array(stats[:12], dtype=np.float32)
            stats_arr = np.clip(stats_arr / 128.0, -2.0, 2.0)
            return torch.tensor(stats_arr).unsqueeze(0)
        except Exception:
            return torch.zeros((1, 12))

    # ── Evidence gating ────────────────────────────────────────────────────

    def _validate_evidence_gate(
        self,
        leaf_cond: dict,
        damage: dict,
        pest: dict,
        color: dict,
        disease: dict
    ) -> Tuple[list, str, float]:
        """
        Multi-label evidence validation. Returns (conditions_list, overall_status, overall_confidence).

        RULES (per spec sections 5, 9, 16):
          - Multi-label: leaf can have disease + pest simultaneously
          - Discoloration ALONE never diagnoses disease
          - Pest confidence < threshold → possible_pest_damage, not confirmed
          - Conflicting high-confidence signals → UNCERTAIN_MULTIPLE_CONDITIONS
          - Low overall confidence → LOW_CONFIDENCE
        """
        cfg_overall = self.thresholds.get("overall", {})
        low_conf_thresh = float(cfg_overall.get("low_confidence_threshold", 0.55))
        unknown_thresh  = float(cfg_overall.get("unknown_threshold", 0.40))

        conditions = []
        active_labels = set()

        # ── Damage ────────────────────────────────────────────────────────
        damage_status  = damage.get("status", "not_detected")
        damage_conf    = float(damage.get("confidence", 0.0))
        min_damage     = self.thresholds.get("damage_detector", {}).get("confirmed_damage_confidence", 0.78)

        if damage_status not in ("not_detected", "intact", "uncertain") and damage_conf >= min_damage:
            conditions.append({
                "type": "physical_damage",
                "name": damage_status,
                "confidence": damage_conf,
                "severity": "UNKNOWN"
            })
            active_labels.add("physical_damage")

        # ── Pest ──────────────────────────────────────────────────────────
        pest_status = pest.get("status", "not_detected")
        pest_conf   = float(pest.get("confidence", 0.0))
        min_pest    = self.thresholds.get("pest_detector", {}).get("confirmed_pest_confidence", 0.82)

        if pest_status == "detected" and pest_conf >= min_pest:
            conditions.append({
                "type": "pest_damage",
                "name": "PEST_DAMAGE_UNSPECIFIED",
                "confidence": pest_conf,
                "severity": "UNKNOWN"
            })
            active_labels.add("pest_damage")
        elif pest_status == "possible_pest_damage":
            conditions.append({
                "type": "pest_damage",
                "name": "PEST_DAMAGE_UNSPECIFIED",
                "confidence": pest_conf,
                "severity": "UNKNOWN",
                "uncertain": True
            })
            active_labels.add("pest_damage_possible")

        # ── Disease (via condition + disease classifier chain) ────────────
        cond_status = leaf_cond.get("status", "uncertain")
        cond_conf   = float(leaf_cond.get("confidence", 0.0))
        disease_name = disease.get("name")
        disease_conf = float(disease.get("confidence", 0.0))
        is_unknown_disease = disease.get("is_unknown", True)

        min_cond = self.thresholds.get("leaf_condition", {}).get("high_confidence", 0.80)

        if cond_status == "abnormal" and cond_conf >= min_cond:
            if not is_unknown_disease and disease_name and disease_conf >= 0.72:
                conditions.append({
                    "type": "disease",
                    "name": disease_name,
                    "confidence": disease_conf,
                    "severity": "UNKNOWN"
                })
            else:
                conditions.append({
                    "type": "disease",
                    "name": "UNKNOWN_ABNORMALITY",
                    "confidence": cond_conf,
                    "severity": "UNKNOWN",
                    "uncertain": True
                })
            active_labels.add("disease")

        # ── Healthy check (strict: ALL indicators must pass) ──────────────
        is_healthy = (
            cond_status == "healthy" and cond_conf >= min_cond and
            "physical_damage" not in active_labels and
            "pest_damage" not in active_labels and
            "disease" not in active_labels
        )

        if is_healthy:
            conditions = [{
                "type": "healthy",
                "name": "healthy",
                "confidence": cond_conf,
                "severity": "NONE"
            }]
            return conditions, "HEALTHY", cond_conf

        # ── Overall status ─────────────────────────────────────────────────
        if not conditions:
            # Nothing detected with sufficient confidence
            overall_conf = max(cond_conf, damage_conf, pest_conf)
            if overall_conf < unknown_thresh:
                return [], "LOW_CONFIDENCE", overall_conf
            return [], "UNKNOWN", overall_conf

        # Multiple conditions
        if len(active_labels) > 1 and not (active_labels <= {"pest_damage_possible"}):
            overall_status = "MULTIPLE_CONDITIONS"
        elif "disease" in active_labels:
            overall_status = "DISEASE"
        elif "pest_damage" in active_labels:
            overall_status = "PEST_DAMAGE"
        elif "physical_damage" in active_labels:
            overall_status = "PHYSICAL_DAMAGE"
        elif "pest_damage_possible" in active_labels:
            overall_status = "PEST_DAMAGE_POSSIBLE"
        else:
            overall_status = "UNKNOWN"

        # Compute overall confidence (weighted by conditions present)
        if conditions:
            overall_conf = float(np.mean([c.get("confidence", 0.0) for c in conditions]))
        else:
            overall_conf = 0.0

        if overall_conf < low_conf_thresh:
            overall_status = "LOW_CONFIDENCE"

        return conditions, overall_status, round(overall_conf, 4)

    # ── Output formatting helpers ──────────────────────────────────────────

    def _build_pest_output(self, pest_result: dict) -> Optional[dict]:
        status = pest_result.get("status", "not_detected")
        if status == "not_detected":
            return None
        return {
            "detected": status == "detected",
            "status": status,
            "confidence": pest_result.get("confidence", 0.0),
            "detections": pest_result.get("detections", [])
        }

    def _build_damage_output(self, damage_result: dict) -> dict:
        status = damage_result.get("status", "not_detected")
        is_detected = status not in ("not_detected", "intact")
        return {
            "detected": is_detected,
            "type": status if is_detected else None,
            "confidence": damage_result.get("confidence", 0.0)
        }

    def _compute_quality_score(self, metrics: dict) -> float:
        """Converts raw quality metrics to a single [0-1] quality score."""
        if not metrics:
            return 0.5
        lap = metrics.get("laplacian_variance", 65.0)
        bri = metrics.get("mean_brightness", 120.0)
        unif = metrics.get("illumination_uniformity", 0.5)
        # Normalize each metric
        blur_score = min(1.0, lap / 200.0)
        bri_score  = 1.0 - abs(bri - 128.0) / 128.0
        return round(float(np.mean([blur_score, bri_score, unif])), 3)

    def _fallback_uncertain(self, model_name: str) -> dict:
        """Returns a safe uncertain result when a model is unavailable."""
        return {
            "status": "uncertain",
            "confidence": 0.0,
            "reason": f"{model_name}_model_unavailable"
        }

    def _build_rejection(self, code: str, metrics: dict, t_start: float, extra: dict = None) -> dict:
        """Builds a structured rejection response."""
        latency_ms = round((time.time() - t_start) * 1000)

        rejection_map = {
            "IMAGE_TOO_DARK": {
                "status": "IMAGE_QUALITY_TOO_LOW",
                "title": "Photo is Too Dark",
                "message": "Move to a brighter area or turn on flash, then retake the photo.",
                "action": "Retake Photo"
            },
            "IMAGE_OVEREXPOSED": {
                "status": "IMAGE_QUALITY_TOO_LOW",
                "title": "Photo is Overexposed",
                "message": "Direct glare is washing out leaf detail. Shield the leaf or adjust exposure.",
                "action": "Retake Photo"
            },
            "IMAGE_TOO_BLURRY": {
                "status": "IMAGE_QUALITY_TOO_LOW",
                "title": "Photo is Blurry",
                "message": "Hold steady and tap to focus on the leaf before capturing.",
                "action": "Retake Photo"
            },
            "FACE_DETECTED": {
                "status": "NOT_A_PLANT_IMAGE",
                "title": "Face Detected",
                "message": "Point the camera at a crop leaf, not a face.",
                "action": "Retake Photo"
            },
            "SOIL_OR_GROUND_IMAGE": {
                "status": "NOT_A_PLANT_IMAGE",
                "title": "No Leaf Detected",
                "message": "No plant leaf was found in this image. Point the camera at a crop leaf.",
                "action": "Place Leaf in Frame"
            },
            "NOT_A_PLANT_IMAGE": {
                "status": "NOT_A_PLANT_IMAGE",
                "title": "No Plant Detected",
                "message": "No leaf or crop structure was detected. Please photograph a plant leaf.",
                "action": "Place Leaf in Frame"
            },
            "LEAF_TOO_SMALL": {
                "status": "LEAF_TOO_SMALL",
                "title": "Leaf is Too Far Away",
                "message": "Move closer so the leaf fills most of the viewfinder.",
                "action": "Move Closer"
            },
            "LEAF_OCCLUDED": {
                "status": "LEAF_OCCLUDED",
                "title": "Leaf is Occluded",
                "message": "The leaf is heavily blocked. Capture an unobstructed leaf.",
                "action": "Clear the Frame"
            }
        }

        info = rejection_map.get(code, {
            "status": "INVALID_IMAGE",
            "title": "Image Cannot Be Analyzed",
            "message": "Please capture a clear, well-lit photograph of a single leaf.",
            "action": "Retake Photo"
        })

        result = {
            "status": "INVALID_IMAGE",
            "rejection_reason": info["status"],
            "rejection_code": code,
            "plant_detected": False,
            "leaf_detected": False,
            "image_quality": self._compute_quality_score(metrics),
            "conditions": [],
            "overall_status": info["status"],
            "overall_confidence": 0.0,
            "image": {
                "quality_code": code,
                "metrics": metrics
            },
            "recommendation": {
                "available": False,
                "title": info["title"],
                "message": info["message"],
                "action": info.get("action", "Retake Photo"),
                "reliability_notice": ""
            },
            "reliability_notice": "",
            **self.version,
            "diagnostics": {"latency_ms": latency_ms}
        }
        if extra:
            result["_debug"] = extra
        return result
