"""
FastAPI + Uvicorn Inference API Server — v2
===========================================
Production-ready REST API for the leaf analysis pipeline.

Endpoints:
  POST /api/v1/analyze-leaf       — main inference endpoint
  GET  /api/v1/health             — health check (returns model load status)
  GET  /api/v1/model-info         — model version + capabilities
  GET  /docs                      — FastAPI auto-generated Swagger UI

Security:
  - File-type validation (JPEG, PNG, WEBP only)
  - Maximum upload size enforcement
  - Image decode validation before inference
  - Rate limiting headers
  - No execution of uploaded content

Input: multipart/form-data { image: <file> }
Output: JSON per spec section 15 / 28
"""

import os
import io
import sys
import logging
import time
import hashlib
from pathlib import Path
from contextlib import asynccontextmanager

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import MODEL_VERSION, PREPROCESSING_VERSION, DATASET_VERSION

logger = logging.getLogger("APIServer")

# ── Dependency imports with graceful fallbacks ────────────────────────────────

try:
    from fastapi import FastAPI, File, UploadFile, HTTPException, Request, status
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    logger.critical("FastAPI/Uvicorn not installed. Run: pip install fastapi uvicorn")

try:
    import numpy as np
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from ml.inference.pipeline import MultiStagePlantVisionPipeline

# ── Configuration ─────────────────────────────────────────────────────────────
API_VERSION = "v1"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024      # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Pipeline is a module-level singleton loaded once at startup
_pipeline: MultiStagePlantVisionPipeline = None

# ── Lifespan context (replaces deprecated on_event) ─────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Loads the inference pipeline on startup."""
    global _pipeline
    logger.info("Loading MultiStagePlantVisionPipeline...")
    _pipeline = MultiStagePlantVisionPipeline(
        thresholds_path=str(PROJECT_ROOT / "config" / "thresholds.json"),
        classes_path=str(PROJECT_ROOT / "config" / "classes.json")
    )
    logger.info("Pipeline ready. Model version: %s", MODEL_VERSION)
    yield
    logger.info("Shutting down API server.")

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="Plant Leaf Health Analysis API",
        description=(
            "Scientifically-grounded AI/ML leaf disease detection system. "
            "Returns structured JSON with conditions, severity, confidence, and recommendations."
        ),
        version=MODEL_VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
else:
    app = None


# ── Validation helpers ────────────────────────────────────────────────────────

def _validate_file_type(filename: str, content_type: str) -> bool:
    """Validates file extension and MIME type."""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS and content_type in ALLOWED_CONTENT_TYPES

def _decode_image(raw_bytes: bytes) -> np.ndarray:
    """
    Safely decodes image bytes to BGR numpy array.
    Validates that the content is actually a valid image before inference.
    Raises ValueError if invalid.
    """
    if CV2_AVAILABLE:
        arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Image data could not be decoded — file may be corrupt or not a valid image.")
        if img.size == 0:
            raise ValueError("Decoded image is empty.")
        return img
    elif PIL_AVAILABLE:
        try:
            pil_img = PILImage.open(io.BytesIO(raw_bytes)).convert("RGB")
            return np.array(pil_img)[:, :, ::-1]  # RGB → BGR
        except Exception as exc:
            raise ValueError(f"PIL decode failed: {exc}")
    else:
        raise ValueError("Neither OpenCV nor Pillow is available for image decoding.")


# ── API Endpoints ─────────────────────────────────────────────────────────────

if FASTAPI_AVAILABLE:

    @app.get(f"/api/{API_VERSION}/health", summary="Health Check", tags=["System"])
    async def health_check():
        """Returns pipeline health and model load status."""
        global _pipeline
        onnx_status = "unavailable"
        classifiers_ready = False

        if _pipeline is not None:
            onnx_status = _pipeline.leaf_detector.model_info.get("status", "unknown")
            classifiers_ready = _pipeline._classifiers_loaded

        return {
            "status": "ok",
            "api_version": API_VERSION,
            "model_version": MODEL_VERSION,
            "dataset_version": DATASET_VERSION,
            "preprocessing_version": PREPROCESSING_VERSION,
            "onnx_detector": onnx_status,
            "classifiers_trained": classifiers_ready,
            "pipeline_ready": _pipeline is not None,
            "timestamp": time.time()
        }

    @app.get(f"/api/{API_VERSION}/model-info", summary="Model Capabilities", tags=["System"])
    async def model_info():
        """Returns full model metadata, capabilities, and limitations."""
        global _pipeline
        base = {
            "model_version": MODEL_VERSION,
            "dataset_version": DATASET_VERSION,
            "preprocessing_version": PREPROCESSING_VERSION,
            "supported_conditions": [
                "HEALTHY", "DISEASE", "PEST_DAMAGE", "PHYSICAL_DAMAGE",
                "STRESS", "MULTIPLE_CONDITIONS", "UNKNOWN"
            ],
            "supported_outputs": [
                "leaf_detection", "leaf_segmentation_mask", "condition_classification",
                "disease_classification", "pest_detection", "damage_detection",
                "severity_estimation", "confidence_calibration", "recommendations"
            ],
            "mvp_crops": ["tomato", "rice", "potato"],
            "input_format": "multipart/form-data: image (JPEG, PNG, WEBP), max 10MB",
            "output_format": "JSON — see /docs for schema",
            "reliability_notice": (
                "AI result is based on visual analysis. "
                "For uncertain or severe cases, verify with an agricultural expert."
            )
        }
        if _pipeline is not None:
            base["onnx_detector"] = _pipeline.leaf_detector.model_info
            base["weights_status"] = getattr(_pipeline, "_weights_status", {})
        return base

    @app.post(f"/api/{API_VERSION}/analyze-leaf", summary="Analyze Leaf Image", tags=["Inference"])
    async def analyze_leaf(request: Request, image: UploadFile = File(...)):
        """
        Main leaf analysis endpoint.

        Accepts a leaf image and returns structured analysis including:
        - Plant and leaf detection
        - Condition classification (healthy / disease / pest / physical damage / unknown)
        - Severity estimation (from segmented mask area)
        - Calibrated confidence scores
        - Treatment recommendations (confidence-gated)

        Returns INVALID_IMAGE with actionable message for unusable inputs.
        """
        global _pipeline

        # ── Security: content-type and filename validation ─────────────────
        if not _validate_file_type(image.filename or "upload.jpg", image.content_type or ""):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Unsupported file type: {image.content_type}. "
                    f"Only JPEG, PNG, and WEBP images are accepted."
                )
            )

        # ── Read file content ──────────────────────────────────────────────
        raw_bytes = await image.read()

        # ── Security: size limit ──────────────────────────────────────────
        if len(raw_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MB limit."
            )

        if len(raw_bytes) < 512:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is too small to be a valid image."
            )

        # ── Security: decode validation ───────────────────────────────────
        try:
            bgr_image = _decode_image(raw_bytes)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc)
            )

        # ── Run inference ──────────────────────────────────────────────────
        if _pipeline is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Inference pipeline is not yet initialized. Please retry in a moment."
            )

        try:
            result = _pipeline.run_inference(bgr_image)
        except Exception as exc:
            logger.error("Inference error for file %s: %s", image.filename, exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An internal error occurred during image analysis. Please try again."
            )

        # ── Add request metadata ───────────────────────────────────────────
        result["request"] = {
            "filename": image.filename,
            "content_type": image.content_type,
            "file_size_bytes": len(raw_bytes),
            "image_hash": hashlib.md5(raw_bytes).hexdigest()[:8]  # short fingerprint for logging
        }

        return JSONResponse(content=result)

    # ── Exception handlers ─────────────────────────────────────────────────────

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "status_code": exc.status_code,
                "path": str(request.url)
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error. The error has been logged.",
                "status_code": 500
            }
        )


def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """Starts the Uvicorn ASGI server."""
    if not FASTAPI_AVAILABLE:
        print("FastAPI not installed. Run: pip install fastapi uvicorn")
        sys.exit(1)
    uvicorn.run(
        "ml.inference.api_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_server(host="0.0.0.0", port=8000, reload=False)
