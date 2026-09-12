"""
Model Evaluator — Scientific Evaluation Suite
==============================================
Implements per-spec section 24 evaluation metrics:
  - Accuracy, Precision, Recall, F1 (macro + per-class)
  - Confusion matrix
  - ROC-AUC (one-vs-rest)
  - PR-AUC
  - Expected Calibration Error (ECE) — measures calibration quality
  - Cross-condition error analysis (per spec section 13)
  - Detection: mAP@50, mAP@50:95
  - Segmentation: IoU, Dice Score

IMPORTANT: Always evaluate on the ISOLATED test set.
Never use the validation set for final reporting.
"""

import sys
import json
import logging
from pathlib import Path
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

logger = logging.getLogger("ModelEvaluator")
logging.basicConfig(level=logging.INFO)

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from sklearn.metrics import (
        classification_report, confusion_matrix, f1_score,
        roc_auc_score, precision_recall_curve, auc,
        precision_score, recall_score, average_precision_score
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class ModelEvaluator:
    """
    Comprehensive scientific evaluation suite for leaf analysis models.
    """

    def __init__(self, class_names: list, output_dir: str = None):
        self.class_names = class_names
        self.output_dir = Path(output_dir) if output_dir else PROJECT_ROOT / "reports"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    # ── Classification metrics ────────────────────────────────────────────────

    def evaluate_classifier(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_probs: np.ndarray,
        split_name: str = "test"
    ) -> dict:
        """
        Computes the full suite of classification metrics.

        Args:
            y_true: ground truth labels (N,)
            y_pred: predicted labels (N,)
            y_probs: predicted probabilities (N, num_classes)
            split_name: e.g. "test" or "validation"

        Returns: metrics dict with all scores + per-class breakdown
        """
        if not SKLEARN_AVAILABLE:
            acc = float((y_pred == y_true).mean())
            return {"accuracy": round(acc, 4), "note": "scikit-learn not installed"}

        n_classes = len(self.class_names)
        metrics = {}

        # ── Overall accuracy ──────────────────────────────────────────────
        metrics["accuracy"] = round(float((y_pred == y_true).mean()), 4)

        # ── Macro-averaged metrics (equal weight per class) ───────────────
        metrics["f1_macro"] = round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4)
        metrics["precision_macro"] = round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4)
        metrics["recall_macro"] = round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4)

        # ── Weighted metrics (class-size weighted) ────────────────────────
        metrics["f1_weighted"] = round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4)

        # ── ROC-AUC ───────────────────────────────────────────────────────
        try:
            if n_classes == 2:
                metrics["roc_auc"] = round(float(roc_auc_score(y_true, y_probs[:, 1])), 4)
            else:
                metrics["roc_auc"] = round(float(
                    roc_auc_score(y_true, y_probs, multi_class="ovr", average="macro")
                ), 4)
        except Exception as e:
            metrics["roc_auc"] = None
            metrics["roc_auc_error"] = str(e)

        # ── PR-AUC ────────────────────────────────────────────────────────
        try:
            pr_aucs = []
            for c in range(n_classes):
                ap = average_precision_score((y_true == c).astype(int), y_probs[:, c])
                pr_aucs.append(float(ap))
            metrics["pr_auc_macro"] = round(float(np.mean(pr_aucs)), 4)
            metrics["pr_auc_per_class"] = {
                self.class_names[c]: round(pr_aucs[c], 4)
                for c in range(min(n_classes, len(self.class_names)))
            }
        except Exception as e:
            metrics["pr_auc_macro"] = None

        # ── Expected Calibration Error (ECE) ─────────────────────────────
        metrics["ece"] = round(float(self.compute_ece(y_true, y_probs)), 4)

        # ── Per-class precision/recall/F1 ─────────────────────────────────
        report = classification_report(
            y_true, y_pred, target_names=self.class_names, output_dict=True, zero_division=0
        )
        metrics["per_class"] = {
            cls: {
                "precision": round(report[cls]["precision"], 4),
                "recall": round(report[cls]["recall"], 4),
                "f1": round(report[cls]["f1-score"], 4),
                "support": int(report[cls]["support"])
            }
            for cls in self.class_names if cls in report
        }

        # ── Confusion matrix ──────────────────────────────────────────────
        cm = confusion_matrix(y_true, y_pred)
        metrics["confusion_matrix"] = cm.tolist()

        # ── Cross-condition error analysis (spec section 13) ──────────────
        metrics["critical_errors"] = self._analyze_critical_errors(y_true, y_pred, cm)

        # ── Save report ───────────────────────────────────────────────────
        report_path = self.output_dir / f"eval_{split_name}.json"
        with open(report_path, "w") as f:
            json.dump(metrics, f, indent=2)
        logger.info("Evaluation report saved: %s", report_path)

        return metrics

    def compute_ece(self, y_true: np.ndarray, y_probs: np.ndarray, n_bins: int = 15) -> float:
        """
        Computes Expected Calibration Error — measures how well confidence
        correlates with actual accuracy. ECE = 0 means perfect calibration.
        """
        max_probs = y_probs.max(axis=1)
        y_pred = y_probs.argmax(axis=1)
        correct = (y_pred == y_true).astype(float)

        bin_edges = np.linspace(0, 1, n_bins + 1)
        ece = 0.0

        for i in range(n_bins):
            mask = (max_probs >= bin_edges[i]) & (max_probs < bin_edges[i + 1])
            if mask.sum() == 0:
                continue
            bin_acc  = correct[mask].mean()
            bin_conf = max_probs[mask].mean()
            ece += mask.sum() / len(y_true) * abs(bin_acc - bin_conf)

        return float(ece)

    def _analyze_critical_errors(self, y_true: np.ndarray, y_pred: np.ndarray, cm: np.ndarray) -> dict:
        """
        Cross-condition error analysis.
        Highlights the most dangerous misclassifications per spec section 13:
          Disease → Healthy (false negative — critical)
          Healthy → Disease (false positive)
          Pest → Disease
          Physical Damage → Pest
        """
        n = min(len(self.class_names), cm.shape[0])
        name_to_idx = {name: i for i, name in enumerate(self.class_names)}
        critical_pairs = [
            ("disease", "healthy", "FALSE_NEGATIVE — disease missed"),
            ("healthy", "disease", "FALSE_POSITIVE — unnecessary treatment risk"),
            ("pest_damage", "disease", "MISCLASS — pest labelled as disease"),
            ("physical_damage", "pest_damage", "MISCLASS — physical damage labelled as pest"),
            ("UNKNOWN_ABNORMALITY", "healthy", "FALSE_NEGATIVE — abnormality missed"),
        ]

        errors = {}
        for source, target, label in critical_pairs:
            src_idx = name_to_idx.get(source)
            tgt_idx = name_to_idx.get(target)
            if src_idx is not None and tgt_idx is not None and src_idx < n and tgt_idx < n:
                count = int(cm[src_idx, tgt_idx])
                total_src = int(cm[src_idx].sum())
                if total_src > 0:
                    errors[f"{source}→{target}"] = {
                        "label": label,
                        "count": count,
                        "rate": round(count / total_src, 4)
                    }

        return errors

    # ── Segmentation metrics ──────────────────────────────────────────────────

    def compute_iou_dice(
        self,
        pred_mask: np.ndarray,
        gt_mask: np.ndarray,
        threshold: float = 0.5
    ) -> dict:
        """
        Computes binary IoU and Dice Score for segmentation masks.

        Args:
            pred_mask: float (H, W) — predicted mask probabilities
            gt_mask: binary (H, W) — ground truth mask
            threshold: binarization threshold

        Returns: {"iou": float, "dice": float}
        """
        pred_bin = (pred_mask >= threshold).astype(bool)
        gt_bin   = gt_mask.astype(bool)

        intersection = np.logical_and(pred_bin, gt_bin).sum()
        union        = np.logical_or(pred_bin, gt_bin).sum()

        iou  = float(intersection / max(union, 1))
        dice = float(2 * intersection / max(pred_bin.sum() + gt_bin.sum(), 1))

        return {"iou": round(iou, 4), "dice": round(dice, 4)}

    def evaluate_segmentation_batch(
        self,
        pred_masks: list,
        gt_masks: list,
        threshold: float = 0.5
    ) -> dict:
        """Averages IoU and Dice over a batch."""
        ious, dices = [], []
        for pred, gt in zip(pred_masks, gt_masks):
            result = self.compute_iou_dice(pred, gt, threshold)
            ious.append(result["iou"])
            dices.append(result["dice"])
        return {
            "mean_iou": round(float(np.mean(ious)), 4),
            "mean_dice": round(float(np.mean(dices)), 4)
        }

    # ── OOD / Uncertainty evaluation ──────────────────────────────────────────

    def evaluate_ood_detection(
        self,
        in_dist_probs: np.ndarray,
        out_dist_probs: np.ndarray
    ) -> dict:
        """
        Evaluates out-of-distribution detection using maximum softmax probability (MSP).
        In-distribution images should have higher max_softmax than OOD images.
        """
        if not SKLEARN_AVAILABLE:
            return {"note": "scikit-learn required for OOD evaluation"}

        in_msp  = in_dist_probs.max(axis=1)
        ood_msp = out_dist_probs.max(axis=1)

        y_true  = np.array([1] * len(in_msp) + [0] * len(ood_msp))
        scores  = np.concatenate([in_msp, ood_msp])

        try:
            auroc = round(float(roc_auc_score(y_true, scores)), 4)
        except Exception:
            auroc = None

        # Entropy-based OOD scoring
        in_entropy  = float(-np.sum(in_dist_probs  * np.log(in_dist_probs  + 1e-9), axis=1).mean())
        ood_entropy = float(-np.sum(out_dist_probs * np.log(out_dist_probs + 1e-9), axis=1).mean())

        return {
            "ood_auroc_msp": auroc,
            "in_dist_mean_entropy": round(in_entropy, 4),
            "ood_mean_entropy": round(ood_entropy, 4),
            "entropy_separability": round(ood_entropy - in_entropy, 4)
        }
