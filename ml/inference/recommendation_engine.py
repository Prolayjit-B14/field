"""
Confidence-Gated Recommendation Engine
=======================================
Implements the multi-stage recommendation pipeline per spec section 14.

Architecture:
  ML prediction
    → confidence check (if below threshold → "consult expert" only)
    → crop identification
    → disease/pest verification (must have visual evidence)
    → severity check
    → recommendation database lookup
    → treatment recommendation with regulatory notice

CRITICAL RULES:
  1. NEVER directly map prediction → pesticide without confidence + evidence check
  2. If confidence < threshold → do NOT recommend any treatment
  3. Recommendations come from a verified knowledge base, NOT from the ML model
  4. Every recommendation includes a reliability notice
  5. Severity must be known before recommending treatment intensity

Loads from: config/recommendation_db.json
"""

import sys
import logging
from pathlib import Path

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import load_recommendation_db, load_thresholds_config

logger = logging.getLogger("RecommendationEngine")

RELIABILITY_NOTICE = (
    "AI result is based on visual analysis only. "
    "For uncertain or severe cases, verify the diagnosis with a qualified agricultural expert "
    "before applying any treatment."
)

LOW_CONFIDENCE_MESSAGE = (
    "Condition could not be identified reliably from this image. "
    "Please capture a closer, well-lit photograph of the affected leaf "
    "or consult a local agricultural expert for in-person diagnosis."
)

UNKNOWN_MESSAGE = (
    "The leaf shows signs of an abnormality that could not be specifically identified. "
    "Document the affected area and consult an agricultural extension officer "
    "for accurate diagnosis before taking any action."
)


class RecommendationEngine:
    """
    Confidence-gated, knowledge-base-driven agricultural recommendation engine.
    """

    def __init__(self, thresholds: dict | None = None):
        self.knowledge_base = load_recommendation_db()
        cfg = thresholds or load_thresholds_config()
        self.overall_cfg = cfg.get("overall", {})
        self.disease_cfg = cfg.get("disease_classifier", {})
        self.low_conf_threshold = float(self.overall_cfg.get("low_confidence_threshold", 0.55))
        self.diagnosis_min_confidence = float(self.disease_cfg.get("min_confidence", 0.72))

    def generate(
        self,
        overall_status: str,
        conditions: list,
        severity: dict,
        overall_confidence: float,
        crop: str | None = None
    ) -> dict:
        """
        Generates a recommendation based on ML outputs and the knowledge base.

        Args:
            overall_status: e.g. "ANALYZED", "LOW_CONFIDENCE", "UNKNOWN"
            conditions: list of condition dicts from pipeline
              Each: {"type": str, "name": str, "confidence": float, "severity": str}
            severity: {"level": str, "affected_area_percent": float}
            overall_confidence: float [0-1] — overall pipeline confidence
            crop: optional crop name string (e.g. "tomato")

        Returns:
            {
              "available": bool,
              "title": str,
              "message": str,
              "control": list[str],
              "prevention": list[str],
              "severity_note": str,
              "regulatory_note": str,
              "reliability_notice": str
            }
        """
        # ── Gate 1: Overall confidence check ──────────────────────────────
        if overall_confidence < self.low_conf_threshold:
            return self._low_confidence_response()

        # ── Gate 2: Status-based routing ──────────────────────────────────
        if overall_status in ("LOW_CONFIDENCE", "INSUFFICIENT_IMAGE", "IMAGE_QUALITY_TOO_LOW"):
            return self._low_confidence_response()

        if overall_status in ("UNKNOWN", "UNKNOWN_ABNORMALITY", "OUT_OF_DISTRIBUTION"):
            return self._unknown_response()

        if overall_status == "HEALTHY":
            return self._healthy_response()

        # ── Gate 3: Condition-specific lookup ─────────────────────────────
        if not conditions:
            return self._unknown_response()

        # Find highest-confidence condition with a specific name
        best_condition = self._select_best_condition(conditions)

        if best_condition is None:
            return self._unknown_response()

        condition_name = best_condition.get("name", "unknown")
        condition_type = best_condition.get("type", "unknown")
        cond_confidence = float(best_condition.get("confidence", 0.0))

        # Gate 3b: Condition-level confidence
        if cond_confidence < self.diagnosis_min_confidence:
            return self._suspected_response(condition_type, condition_name)

        # ── Gate 4: Knowledge base lookup ─────────────────────────────────
        db_key = self._find_db_key(condition_name, crop)
        if db_key is None or db_key not in self.knowledge_base:
            # Known condition type but no specific entry → general guidance
            return self._suspected_response(condition_type, condition_name)

        entry = self.knowledge_base[db_key]
        severity_level = severity.get("level", "UNKNOWN") if severity else "UNKNOWN"
        severity_note = self._build_severity_note(severity_level, severity)

        return {
            "available": True,
            "title": entry.get("display_name", condition_name.replace("_", " ").title()),
            "message": entry.get("message", ""),
            "symptoms": entry.get("symptoms", ""),
            "control": entry.get("control", []),
            "prevention": entry.get("prevention", []),
            "severity_note": severity_note,
            "regulatory_note": entry.get("regulatory_note",
                "Consult local agricultural extension services before applying any treatment."),
            "reliability_notice": RELIABILITY_NOTICE
        }

    def _select_best_condition(self, conditions: list) -> dict:
        """Returns the highest-confidence non-unknown, non-healthy condition."""
        candidates = [
            c for c in conditions
            if c.get("name") not in (None, "UNKNOWN_ABNORMALITY", "healthy", "HEALTHY")
            and c.get("confidence", 0) >= self.diagnosis_min_confidence
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda c: c.get("confidence", 0))

    def _find_db_key(self, condition_name: str, crop: str | None = None) -> str | None:
        """Looks up the best matching key in the knowledge base."""
        if condition_name in self.knowledge_base:
            return condition_name
        # Try crop-specific lookup
        if crop:
            crop_specific = f"{crop}_{condition_name}"
            if crop_specific in self.knowledge_base:
                return crop_specific
        # Try normalized key
        normalized = condition_name.lower().replace(" ", "_")
        if normalized in self.knowledge_base:
            return normalized
        return None

    def _build_severity_note(self, level: str, severity: dict) -> str:
        if level == "UNKNOWN":
            return "Severity could not be estimated from this image."
        area = severity.get("affected_area_percent") if severity else None
        area_str = f" (approximately {area:.0f}% of leaf area affected)" if area else ""
        notes = {
            "NONE": "No significant affected area detected.",
            "MILD": f"Mild severity{area_str}. Early-stage management recommended.",
            "MODERATE": f"Moderate severity{area_str}. Prompt action recommended.",
            "SEVERE": f"Severe severity{area_str}. Immediate action strongly recommended."
        }
        return notes.get(level, "")

    def _low_confidence_response(self) -> dict:
        return {
            "available": False,
            "title": "Unable to Identify Condition",
            "message": LOW_CONFIDENCE_MESSAGE,
            "control": [],
            "prevention": [],
            "severity_note": "",
            "regulatory_note": "",
            "reliability_notice": RELIABILITY_NOTICE
        }

    def _unknown_response(self) -> dict:
        entry = self.knowledge_base.get("unknown", {})
        return {
            "available": False,
            "title": "Condition Unknown",
            "message": entry.get("guidance", UNKNOWN_MESSAGE),
            "control": [],
            "prevention": [],
            "severity_note": "",
            "regulatory_note": "",
            "reliability_notice": RELIABILITY_NOTICE
        }

    def _healthy_response(self) -> dict:
        entry = self.knowledge_base.get("healthy", {})
        return {
            "available": True,
            "title": "Plant Appears Healthy",
            "message": entry.get("message", "Continue regular monitoring."),
            "control": [],
            "prevention": entry.get("prevention", ["Regular field scouting"]),
            "severity_note": "No abnormality detected.",
            "regulatory_note": "",
            "reliability_notice": RELIABILITY_NOTICE
        }

    def _suspected_response(self, condition_type: str, condition_name: str) -> dict:
        """Response when a condition type is detected but specific ID is low-confidence."""
        type_messages = {
            "disease": ("Disease Suspected",
                "Visual evidence of a possible disease condition was observed, "
                "but a specific disease could not be reliably identified. "
                "Please consult an agricultural expert for accurate diagnosis."),
            "pest_damage": ("Pest Activity Suspected",
                "Signs of pest activity or feeding damage were detected, "
                "but the specific pest could not be identified. "
                "Inspect the underside of affected leaves and consult an expert."),
            "physical_damage": ("Physical Damage Detected",
                "Physical or mechanical damage to leaf tissue was detected. "
                "Monitor for secondary infection at damaged sites."),
            "stress": ("Plant Stress Detected",
                "Signs of environmental or nutrient stress were detected. "
                "Check soil moisture, nutrition, and growing conditions."),
        }
        title, message = type_messages.get(condition_type,
            ("Abnormality Suspected", "An abnormal condition was detected but not specifically identified."))
        return {
            "available": False,
            "title": title,
            "message": message,
            "control": [],
            "prevention": [],
            "severity_note": "",
            "regulatory_note": "Do not apply treatments based on unconfirmed diagnoses.",
            "reliability_notice": RELIABILITY_NOTICE
        }
