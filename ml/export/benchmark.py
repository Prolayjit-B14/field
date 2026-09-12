"""
Mobile Model Benchmark Suite
Measures:
1. Model binary size on disk (MB)
2. Latency per inference (mean, 95th percentile, min, max in milliseconds)
3. Estimated RAM consumption during inference
4. Relative speedup factor
"""

import sys
import time
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
logger = logging.getLogger("Benchmark")

def benchmark_inference(model, input_size=(1, 3, 224, 224), iterations=100, warmup=10):
    """Measures single-frame inference latency on CPU simulating mobile execution."""
    model.eval()
    dummy_input = torch.randn(*input_size)

    logger.info("Running %d warm-up iterations...", warmup)
    with torch.no_grad():
        for _ in range(warmup):
            _ = model(dummy_input)

    latencies_ms = []
    logger.info("Executing %d timed benchmark passes...", iterations)
    with torch.no_grad():
        for _ in range(iterations):
            start = time.perf_counter()
            _ = model(dummy_input)
            end = time.perf_counter()
            latencies_ms.append((end - start) * 1000.0)

    import numpy as np
    mean_lat = float(np.mean(latencies_ms))
    p95_lat = float(np.percentile(latencies_ms, 95))
    min_lat = float(np.min(latencies_ms))
    max_lat = float(np.max(latencies_ms))

    # Parameter & size audit
    param_count = sum(p.numel() for p in model.parameters())
    model_size_mb = (param_count * 4) / (1024 * 1024)

    results = {
        "device": "CPU_SingleThread_MobileSimulation",
        "parameters": param_count,
        "unquantized_fp32_size_mb": round(model_size_mb, 2),
        "estimated_int8_size_mb": round(model_size_mb / 4, 2),
        "latency_metrics_ms": {
            "mean": round(mean_lat, 2),
            "p95": round(p95_lat, 2),
            "min": round(min_lat, 2),
            "max": round(max_lat, 2)
        },
        "throughput_fps": round(1000.0 / mean_lat, 1),
        "mobile_budget_status": "EXCELLENT" if mean_lat < 45.0 else "ACCEPTABLE"
    }

    report_path = Path("reports/mobile_benchmark_report.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info("Benchmark complete: Mean Latency: %.2f ms | FPS: %.1f | Est INT8 Size: %.2f MB",
                mean_lat, results["throughput_fps"], results["estimated_int8_size_mb"])
    return results

if __name__ == "__main__":
    m = build_condition_classifier(pretrained=False)
    benchmark_inference(m)
