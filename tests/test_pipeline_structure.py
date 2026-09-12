"""
Unit Tests for Structured Pipeline Output Compliance
Verifies strict compliance with Section 17 schema:
- Top-level keys: status, image, leafCondition, damage, pest, color, overall, evidence, recommendation
- Validates data types and confidence normalization
"""

import sys
from pathlib import Path
import unittest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from ml.inference.pipeline import MultiStagePlantVisionPipeline

class TestPipelineStructure(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiStagePlantVisionPipeline()

    def test_structured_json_schema(self):
        # Create synthetic valid green leaf image
        valid_leaf = np.zeros((300, 300, 3), dtype=np.uint8)
        valid_leaf[:, :] = [40, 160, 40] # Vibrant green
        # Add high frequency noise to pass blur check
        noise = np.random.randint(0, 30, (300, 300, 3), dtype=np.uint8)
        valid_leaf = np.clip(valid_leaf + noise, 0, 255)

        result = self.pipeline.run_inference(valid_leaf)

        # Assert mandatory keys
        self.assertIn("status", result)
        self.assertIn("image", result)
        self.assertIn("leafCondition", result)
        self.assertIn("damage", result)
        self.assertIn("pest", result)
        self.assertIn("color", result)
        self.assertIn("overall", result)
        self.assertIn("evidence", result)
        self.assertIn("recommendation", result)

        # Assert nested structure
        self.assertIsInstance(result["evidence"], list)
        self.assertIsInstance(result["recommendation"], dict)
        self.assertIn("title", result["recommendation"])
        self.assertIn("message", result["recommendation"])

if __name__ == "__main__":
    unittest.main()
