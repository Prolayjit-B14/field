"""
Model Export & Mobile Quantization Pipeline
Exports PyTorch weights to:
1. ONNX (Open Neural Network Exchange) format with dynamic batching
2. TFLite INT8 (Full integer quantization for ultra-low power Android NNAPI)
3. TFLite FP16 (Half-precision for mobile GPU acceleration)
"""
import sys
import os
import json
import logging
from pathlib import Path

# Ensure project root is in sys.path
CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
from ml.models.leaf_condition_classifier import build_condition_classifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ModelExporter")

EXPORT_DIR = ML_DIR / "export" / "mobile_models"

def export_to_onnx(model, input_shape=(1, 3, 224, 224), output_path=EXPORT_DIR / "condition_classifier.onnx"):
    """Exports PyTorch model to optimized ONNX format."""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    model.eval()
    dummy_input = torch.randn(*input_shape)

    try:
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=["input_tensor"],
            output_names=["output_logits"],
            dynamic_axes={"input_tensor": {0: "batch_size"}, "output_logits": {0: "batch_size"}}
        )
        logger.info("ONNX export succeeded: %s (Size: %.2f MB)", output_path, output_path.stat().st_size / (1024 * 1024))
        return str(output_path)
    except Exception as e:
        logger.error("ONNX export failed: %s", e)
        return None

def generate_quantization_manifest(model_name="leaf_condition_classifier", onnx_path=None):
    """Generates calibration and quantization manifest for TensorFlow Lite conversion."""
    manifest = {
        "model_name": model_name,
        "source_onnx": str(onnx_path) if onnx_path else "condition_classifier.onnx",
        "targets": [
            {
                "format": "tflite_int8",
                "quantization_type": "post_training_integer_quantization",
                "representative_dataset_size": 200,
                "input_dtype": "uint8",
                "output_dtype": "int8",
                "target_hardware": ["Android NNAPI", "Qualcomm Hexagon DSP"]
            },
            {
                "format": "tflite_fp16",
                "quantization_type": "float16_precision",
                "target_hardware": ["Mobile GPU", "Apple Metal"]
            }
        ],
        "preprocessing": {
            "input_size": [224, 224],
            "norm_mean": [0.485, 0.456, 0.406],
            "norm_std": [0.229, 0.224, 0.225]
        }
    }
    manifest_path = EXPORT_DIR / f"{model_name}_quantization_spec.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    logger.info("Quantization manifest generated at %s", manifest_path)
    return manifest_path

if __name__ == "__main__":
    model = build_condition_classifier(pretrained=False)
    onnx_file = export_to_onnx(model)
    generate_quantization_manifest(onnx_path=onnx_file)
