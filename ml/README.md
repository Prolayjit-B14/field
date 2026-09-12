# Production-Oriented AI Plant Vision System
### Precision Agronomic Vision Pipeline for Agriculture Mobile Applications

This repository contains a modular computer-vision and machine-learning system specifically engineered for smartphone camera leaf diagnosis. It does **not** rely on general-purpose image-prompting or LLM guessing; instead, it enforces a verified multi-stage vision pipeline with hardware quality validation, multi-task models, and evidence-based decision gates.

---

## 1. System Architecture Pipeline

```
PHONE CAMERA / GALLERY
        ↓
[ STAGE 1: IMAGE QUALITY CHECK ]
(Laplacian blur check, luminance bounds, plant coverage ratio)
        ↓
[ STAGE 2: PLANT / LEAF DETECTION ]
(Is valid plant present? Filter faces, tools, soil-only, background)
        ↓
[ STAGE 3: LEAF REGION EXTRACTION ]
(Crop & focus on primary leaf blade)
        ↓
[ STAGE 4: PARALLEL MULTI-MODEL INFERENCE ]
   ├── Model B: Leaf Condition (Healthy vs Abnormal vs Uncertain)
   ├── Model C: Physical Damage (Tears, Holes, Snapped Petioles, Intact)
   ├── Model D: Pest Evidence (Visible Insects, Webbing, Not Detected)
   └── Model E: Color & Chlorosis (Normal Green vs Discolored vs Senescent)
        ↓
[ STAGE 5: CONFIDENCE + EVIDENCE VALIDATION GATE ]
(Evidence check: Yellow leaf ≠ Disease; Low pest conf ≠ Pest Detected)
        ↓
[ STAGE 6: FINAL STRUCTURED RESULT & UNCERTAIN STATE ]
(Healthy | Damage Detected | Pest Detected | Possible Pest | Possible Abnormality | Unable to Determine)
        ↓
FARMER MOBILE UI / CAPACITOR WEBVIEW
```

---

## 2. Directory Layout

```
/
├── config/
│   ├── classes.json               # Canonical class definitions across all models
│   ├── thresholds.json            # Calibrated validation confidence & quality thresholds
│   └── preprocessing.json         # Image resolution, normalization, and quality parameters
│
├── ml/
│   ├── datasets/
│   │   ├── dataset_manager.py     # Directory provisioner and raw dataset catalog
│   │   ├── dataset_validator.py   # Deduplication (dHash), corrupt check, annotation validation
│   │   ├── split_generator.py     # 70/15/15 Group-isolated split generator (zero leakage)
│   │   └── custom_dataset_collector.py # 14 custom edge-case categories specification
│   ├── preprocessing/
│   │   ├── quality_checker.py     # CV Laplacian variance & HSV chromaticity validator
│   │   └── augmentations.py       # Agronomic-safe sunlight, shadow, & rotation pipeline
│   ├── models/
│   │   ├── plant_detector.py      # Model A: MobileNetV3 SSD-Lite leaf detector
│   │   ├── leaf_condition_classifier.py # Model B: Intact vs damaged vs uncertain
│   │   ├── damage_detector.py     # Model C: Structural damage detection & mask head
│   │   ├── pest_detector.py       # Model D: Insect & pest evidence detector with recall weighting
│   │   └── color_classifier.py    # Model E: Hybrid CNN + CIELAB/HSV statistical moment classifier
│   ├── training/
│   │   └── train_condition.py     # Two-stage transfer learning training script
│   ├── evaluation/
│   │   ├── evaluator.py           # Precision, Recall, F1, balanced accuracy & confusion matrix
│   │   ├── threshold_calibrator.py# Precision-optimizing threshold calibration
│   │   └── error_analyzer.py      # False positive & false negative report generator
│   ├── inference/
│   │   ├── pipeline.py            # Multi-stage inference orchestrator with evidence gate
│   │   └── api_server.py          # REST API server (POST /api/v1/analyze-plant)
│   └── export/
│       ├── export_tflite.py       # ONNX and TFLite (INT8 / FP16) quantization exporter
│       └── benchmark.py           # Single-thread mobile latency and RAM benchmark
│
├── mobile/
│   ├── camera/
│   │   └── QualityChecker.js      # On-device HTML5 Canvas real-time quality & blur validator
│   ├── vision/
│   │   └── PlantVisionEngine.js   # Client-side multi-stage pipeline bridge
│   └── results/
│       ├── ResultFormatter.js     # Formats structured JSON to farmer-friendly UI tokens
│       └── DeveloperDiagnostics.jsx # Admin diagnostics panel (raw metrics, latency, thresholds)
│
├── reports/                       # Generated confusion matrices, false positive logs, benchmarks
└── tests/
    ├── test_quality_checker.py    # Blur, exposure, and non-plant rejection tests
    ├── test_evidence_gate.py      # Evidence gate and uncertainty logic unit tests
    └── test_pipeline_structure.py # Strict JSON schema compliance tests
```

---

## 3. Dataset Setup Instructions

To train or fine-tune models, place verified datasets into the following directories:

1. **PlantDoc** (Field-condition disease & background variation):
   `datasets/raw/plant_health/plantdoc/`
   Source: [https://github.com/pratikkayal/PlantDoc-Dataset](https://github.com/pratikkayal/PlantDoc-Dataset)

2. **PlantVillage** (Healthy leaves & laboratory disease classes):
   `datasets/raw/plant_health/plantvillage/`
   Source: [https://github.com/spmohanty/plantvillage-dataset](https://github.com/spmohanty/plantvillage-dataset)

3. **IP102** (Insect pest recognition benchmark):
   `datasets/raw/pest/ip102/`
   Source: [https://github.com/xpwu95/IP102](https://github.com/xpwu95/IP102)

4. **Paddy Doctor** (Rice-specific diseases and healthy pad):
   `datasets/raw/plant_health/paddy_doctor/`
   Source: [https://github.com/PawarMukesh/RiceLeaf-Disease-Detector](https://github.com/PawarMukesh/RiceLeaf-Disease-Detector)

5. **Custom Smartphone Dataset** (14 mandatory edge cases):
   `datasets/raw/custom/`
   Run `python ml/datasets/custom_dataset_collector.py` to generate the 14 category folders.

---

## 4. Training & Validation Execution

```bash
# 1. Initialize dataset directory layout
python ml/datasets/dataset_manager.py

# 2. Validate annotations, detect duplicates, and verify zero data leakage
python ml/datasets/dataset_validator.py

# 3. Generate 70/15/15 grouped splits with session isolation
python ml/datasets/split_generator.py

# 4. Train Model B (Two-Stage Transfer Learning: Freeze -> Unfreeze with Cosine LR)
python ml/training/train_condition.py

# 5. Calibrate confidence thresholds on the validation set
python ml/evaluation/threshold_calibrator.py

# 6. Evaluate test set metrics (Precision, Recall, F1, Confusion Matrix)
python ml/evaluation/evaluator.py

# 7. Generate Error Analysis Reports (False positives, negatives, borderline cases)
python ml/evaluation/error_analyzer.py

# 8. Export to ONNX and quantized TFLite INT8 / FP16
python ml/export/export_tflite.py

# 9. Benchmark mobile inference latency and memory budget
python ml/export/benchmark.py
```

---

## 5. Output Schema (Section 17 Compliance)

Every inference outputs strict, typed JSON:

```json
{
  "status": "success",
  "image": {
    "isPlantImage": true,
    "quality": "good",
    "leafVisibility": "good",
    "metrics": {
      "meanLuminance": 122,
      "blurVariance": 84,
      "leafCoverageRatio": 0.48
    }
  },
  "leafCondition": {
    "status": "healthy",
    "confidence": 0.94,
    "evidence": [
      "Leaf structure appears intact",
      "No significant physical damage visible"
    ]
  },
  "damage": {
    "status": "not_detected",
    "confidence": 0.91,
    "regions": []
  },
  "pest": {
    "status": "not_detected",
    "confidence": 0.93,
    "detections": []
  },
  "color": {
    "status": "normal_green",
    "confidence": 0.95,
    "evidence": [
      "Leaf appears predominantly green"
    ]
  },
  "overall": {
    "status": "HEALTHY",
    "confidence": "94% Confidence",
    "title": "Healthy Plant",
    "summary": "Normal green color, intact leaf structure, and no visible pest signs."
  },
  "evidence": [
    "Leaf appears predominantly green",
    "Leaf structure appears intact",
    "No visible pest detected",
    "No significant physical damage detected"
  ],
  "recommendation": {
    "title": "Plant Appears Healthy",
    "message": "Continue regular monitoring and maintain current care routine."
  }
}
```

---

## 6. Critical Operational Principles

1. **Yellow Leaf ≠ Disease**: Discoloration is classified as `possible_abnormality` and triggers an inspection recommendation, never an automatic disease diagnosis.
2. **Strict Pest Evidence**: Pests are marked `PEST_DETECTED` only when confidence is $\ge 0.85$ and visual physical evidence exists. Ambiguous signs trigger `POSSIBLE_PEST_ACTIVITY` (`[ Capture Close-up ]`).
3. **Four-State Indicator Support**:
   - 🟢 **Healthy / Normal**
   - 🔴 **Pest Detected**
   - 🟠 **Damaged / Discolored**
   - ⚪ **Uncertain / Insufficient Evidence**
4. **Rejection Gates**:
   - `IMAGE_TOO_DARK` / `IMAGE_TOO_BLURRY` $\rightarrow$ `IMAGE_QUALITY_TOO_LOW`
   - `NOT_A_PLANT_IMAGE` $\rightarrow$ Rejects non-plant subjects
   - `LEAF_TOO_SMALL` $\rightarrow$ Prompts *"Move closer to the leaf"*
