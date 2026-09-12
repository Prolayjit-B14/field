"""
Unit Tests for Evidence Gating and Uncertainty Logic
Verifies:
1. Yellow leaf alone NEVER outputs confirmed disease.
2. Low confidence pest (< 0.85) NEVER outputs confirmed pest.
3. Healthy state is ONLY declared when structure, damage, pest, and color pass.
4. Insufficient evidence triggers UNKNOWN / INSUFFICIENT_EVIDENCE.
"""

import sys
from pathlib import Path
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.inference.pipeline import MultiStagePlantVisionPipeline

class TestEvidenceGate(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiStagePlantVisionPipeline()

    def test_yellow_leaf_does_not_diagnose_disease(self):
        """Rule: Leaf discoloration alone must not trigger a disease diagnosis."""
        leaf_cond = {"status": "healthy", "confidence": 0.90}
        damage = {"status": "not_detected", "confidence": 0.90}
        pest = {"status": "not_detected", "confidence": 0.90}
        color = {"status": "yellowing", "confidence": 0.88}

        overall, evidence, recommendation = self.pipeline._validate_evidence_gate(
            leaf_cond, damage, pest, color
        )

        self.assertNotEqual(overall["status"], "disease_detected")
        self.assertEqual(overall["status"], "possible_abnormality")
        self.assertIn("Visible Discoloration Detected", recommendation["title"])

    def test_low_confidence_pest_triggers_uncertainty(self):
        """Rule: Pest confidence < 0.85 must never display 'Pest Detected'."""
        leaf_cond = {"status": "damaged", "confidence": 0.70}
        damage = {"status": "not_detected", "confidence": 0.80}
        pest = {"status": "possible_pest_damage", "confidence": 0.68}
        color = {"status": "normal_green", "confidence": 0.85}

        overall, evidence, recommendation = self.pipeline._validate_evidence_gate(
            leaf_cond, damage, pest, color
        )

        self.assertNotEqual(overall["status"], "pest_detected")
        self.assertEqual(overall["status"], "possible_pest_activity")
        self.assertIn("close-up", recommendation["message"].lower())

    def test_confirmed_pest_requires_high_confidence(self):
        """Rule: Pest detected requires confidence >= 0.85 and visual evidence."""
        leaf_cond = {"status": "damaged", "confidence": 0.85}
        damage = {"status": "not_detected", "confidence": 0.85}
        pest = {"status": "detected", "confidence": 0.93}
        color = {"status": "abnormal_discoloration", "confidence": 0.80}

        overall, evidence, recommendation = self.pipeline._validate_evidence_gate(
            leaf_cond, damage, pest, color
        )

        self.assertEqual(overall["status"], "pest_detected")
        self.assertEqual(overall["confidence"], "93%")

    def test_healthy_requires_all_unanimous_checks(self):
        """Rule: Healthy state is strictly conditional on intact leaf, normal color, no pest, no damage."""
        leaf_cond = {"status": "healthy", "confidence": 0.94}
        damage = {"status": "not_detected", "confidence": 0.92}
        pest = {"status": "not_detected", "confidence": 0.93}
        color = {"status": "normal_green", "confidence": 0.95}

        overall, evidence, recommendation = self.pipeline._validate_evidence_gate(
            leaf_cond, damage, pest, color
        )

        self.assertEqual(overall["status"], "healthy")
        self.assertIn("Plant Appears Healthy", recommendation["title"])

if __name__ == "__main__":
    unittest.main()
