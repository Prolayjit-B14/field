"""
Disease Classifier Training Script — EfficientNet-B3
====================================================
Trains the DiseaseClassifier on leaf disease datasets per spec sections 12, 22, 23.

Training strategy (spec section 22):
  1. Load ImageNet-pretrained EfficientNet-B3
  2. Freeze backbone — train classification head only
  3. Unfreeze upper backbone layers for fine-tuning
  4. AdamW optimizer + cosine LR scheduler + early stopping
  5. Weighted cross-entropy for class imbalance
  6. Mixed-precision training (if GPU supports it)
  7. Post-training temperature calibration
  8. Per-class metrics on isolated test set

Dataset sources (spec section 10 / dataset_registry.json):
  - PlantVillage (white-background controlled — 54k images)
  - PlantDoc (real-field conditions — 2.5k images)
  - Combined for generalization

Dataset split strategy:
  - Split by plant/source ID to prevent data leakage
  - Train 70 / Validation 15 / Test 15
  - Validation used for threshold selection + calibration
  - Test set NEVER seen during training or calibration

Experiment tracking: MLflow
Model artifacts saved to: ml/models/checkpoints/disease/
"""

import sys
import json
import time
import logging
from pathlib import Path
import numpy as np

CURRENT_FILE = Path(__file__).resolve()
ML_DIR = CURRENT_FILE.parents[1]
PROJECT_ROOT = ML_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.common import MODELS_CHECKPOINTS_DIR, MODEL_VERSION, DATASET_VERSION

logger = logging.getLogger("DiseaseTrainer")
logging.basicConfig(level=logging.INFO)

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, Dataset
    from torch.cuda.amp import GradScaler, autocast
    from torchvision import transforms
    import cv2
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.critical("PyTorch not installed. Cannot run training.")

try:
    import mlflow
    import mlflow.pytorch
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    logger.warning("MLflow not installed — experiment tracking disabled.")

try:
    from sklearn.metrics import (
        classification_report, confusion_matrix, f1_score,
        roc_auc_score, precision_score, recall_score
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from ml.models.disease_classifier import build_disease_classifier


# ── Configuration ─────────────────────────────────────────────────────────────
CONFIG = {
    "model_name": "DiseaseClassifier",
    "backbone": "efficientnet_b3",
    "batch_size": 32,
    "initial_lr": 1e-3,
    "finetune_lr": 1e-4,
    "weight_decay": 1e-4,
    "freeze_epochs": 5,    # Train head only with frozen backbone
    "finetune_epochs": 20, # Unfreeze top backbone layers + fine-tune
    "patience": 6,         # Early stopping patience
    "input_size": 384,
    "num_workers": 4,
    "fp16": True,          # Mixed-precision training
    "temperature_calibration": True
}


# ── Dataset class ─────────────────────────────────────────────────────────────

if TORCH_AVAILABLE:
    class LeafDiseaseDataset(Dataset):
        """
        Leaf disease image dataset.

        Expects folder structure:
            dataset/images/{split}/{class_name}/*.jpg

        Or reads from a metadata CSV with columns: image_path, label

        Class-to-index mapping is built from sorted class folder names.
        """

        TRAIN_TRANSFORM = transforms.Compose([
            transforms.ToPILImage(),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.1),
            transforms.RandomRotation(degrees=20),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),  # mild — preserves lesion color
            transforms.Resize((CONFIG["input_size"], CONFIG["input_size"])),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        VAL_TRANSFORM = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((CONFIG["input_size"], CONFIG["input_size"])),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        def __init__(self, split_dir: Path, class_names: list = None, split: str = "train"):
            self.split = split
            self.transform = self.TRAIN_TRANSFORM if split == "train" else self.VAL_TRANSFORM
            self.samples = []

            split_path = Path(split_dir)
            if not split_path.exists():
                logger.warning("Dataset split path does not exist: %s", split_path)
                self._build_synthetic_dataset()
                return

            # Auto-discover class folders
            class_dirs = sorted([d for d in split_path.iterdir() if d.is_dir()])
            if class_names:
                self.class_names = class_names
            else:
                self.class_names = [d.name for d in class_dirs]

            self.class_to_idx = {name: i for i, name in enumerate(self.class_names)}

            for class_dir in class_dirs:
                class_name = class_dir.name
                if class_name not in self.class_to_idx:
                    logger.warning("Unknown class folder: %s — skipping", class_name)
                    continue
                label = self.class_to_idx[class_name]
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
                    for img_path in class_dir.glob(ext):
                        self.samples.append((str(img_path), label))

            logger.info("Dataset split '%s': %d samples, %d classes", split, len(self.samples), len(self.class_names))

        def _build_synthetic_dataset(self):
            """Creates a minimal synthetic dataset for dry-run testing."""
            logger.warning("Using synthetic dataset — no real images found.")
            self.class_names = ["healthy", "tomato_early_blight", "UNKNOWN_ABNORMALITY"]
            self.class_to_idx = {n: i for i, n in enumerate(self.class_names)}
            # 10 synthetic samples per class
            for i, name in enumerate(self.class_names):
                for _ in range(10):
                    self.samples.append((None, i))  # synthetic entry

        def __len__(self):
            return len(self.samples)

        def __getitem__(self, idx):
            img_path, label = self.samples[idx]
            if img_path is None:
                # Synthetic sample — random noise image
                img = (np.random.rand(CONFIG["input_size"], CONFIG["input_size"], 3) * 255).astype(np.uint8)
            else:
                img = cv2.imread(img_path)
                if img is None:
                    img = np.zeros((CONFIG["input_size"], CONFIG["input_size"], 3), dtype=np.uint8)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            tensor = self.transform(img)
            return tensor, label


# ── Training functions ────────────────────────────────────────────────────────

def compute_class_weights(dataset) -> "torch.Tensor":
    """Computes inverse-frequency class weights for weighted cross-entropy loss."""
    label_counts = np.zeros(len(dataset.class_names))
    for _, label in dataset.samples:
        if label < len(label_counts):
            label_counts[label] += 1
    label_counts = np.maximum(label_counts, 1)
    weights = 1.0 / label_counts
    weights = weights / weights.sum() * len(label_counts)  # normalize to N
    logger.info("Class weights: %s", dict(zip(dataset.class_names, weights.round(3))))
    return torch.tensor(weights, dtype=torch.float32)


def temperature_calibrate(model, val_loader, device) -> float:
    """
    Finds optimal temperature scale on validation set (minimizes ECE).
    Returns calibrated temperature value.
    """
    model.eval()
    logits_list, labels_list = [], []

    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs = imgs.to(device)
            raw_logits = model(imgs, return_calibrated=False)
            logits_list.append(raw_logits.cpu())
            labels_list.append(labels)

    all_logits = torch.cat(logits_list)
    all_labels = torch.cat(labels_list)

    # Grid search over temperature [0.5, 3.0]
    best_nll = float("inf")
    best_temp = 1.5
    nll_fn = nn.CrossEntropyLoss()

    for temp in np.arange(0.5, 3.0, 0.05):
        calibrated = all_logits / temp
        nll = nll_fn(calibrated, all_labels).item()
        if nll < best_nll:
            best_nll = nll
            best_temp = temp

    logger.info("Calibration temperature: %.3f (val NLL: %.4f)", best_temp, best_nll)
    return float(best_temp)


def train_one_epoch(model, loader, optimizer, criterion, scaler, device) -> float:
    """Runs one training epoch. Returns mean loss."""
    model.train()
    total_loss = 0.0

    for batch_idx, (imgs, labels) in enumerate(loader):
        imgs   = imgs.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        optimizer.zero_grad()

        if scaler is not None:
            with autocast():
                logits = model(imgs)
                loss = criterion(logits, labels)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        total_loss += loss.item()

    return total_loss / max(len(loader), 1)


@torch.no_grad()
def evaluate(model, loader, device, class_names: list = None) -> dict:
    """Evaluates model on a DataLoader. Returns per-class metrics."""
    model.eval()
    all_probs, all_preds, all_labels = [], [], []
    total_loss = 0.0
    criterion = nn.CrossEntropyLoss()

    for imgs, labels in loader:
        imgs   = imgs.to(device)
        labels = labels.to(device)
        logits = model(imgs, return_calibrated=True)
        loss   = criterion(logits, labels)
        probs  = torch.softmax(logits, dim=1)
        preds  = probs.argmax(dim=1)

        all_probs.append(probs.cpu().numpy())
        all_preds.append(preds.cpu().numpy())
        all_labels.append(labels.cpu().numpy())
        total_loss += loss.item()

    all_probs  = np.vstack(all_probs)
    all_preds  = np.concatenate(all_preds)
    all_labels = np.concatenate(all_labels)

    metrics = {
        "val_loss": round(total_loss / max(len(loader), 1), 4),
        "accuracy": round(float((all_preds == all_labels).mean()), 4)
    }

    if SKLEARN_AVAILABLE:
        num_classes = all_probs.shape[1]
        metrics["f1_macro"] = round(float(f1_score(all_labels, all_preds, average="macro", zero_division=0)), 4)
        metrics["precision_macro"] = round(float(precision_score(all_labels, all_preds, average="macro", zero_division=0)), 4)
        metrics["recall_macro"] = round(float(recall_score(all_labels, all_preds, average="macro", zero_division=0)), 4)

        # ROC-AUC (one-vs-rest for multiclass)
        try:
            if num_classes == 2:
                metrics["roc_auc"] = round(float(roc_auc_score(all_labels, all_probs[:, 1])), 4)
            else:
                metrics["roc_auc"] = round(float(roc_auc_score(all_labels, all_probs, multi_class="ovr", average="macro")), 4)
        except Exception:
            metrics["roc_auc"] = None

        # Per-class report
        if class_names:
            report = classification_report(all_labels, all_preds, target_names=class_names, output_dict=True, zero_division=0)
            metrics["per_class"] = {
                cls: {"precision": report[cls]["precision"], "recall": report[cls]["recall"], "f1": report[cls]["f1-score"]}
                for cls in class_names if cls in report
            }

        # Confusion matrix (cross-condition error analysis per spec section 13)
        metrics["confusion_matrix"] = confusion_matrix(all_labels, all_preds).tolist()

    return metrics


def train(dataset_dir: str = None, output_dir: str = None, config: dict = None):
    """
    Full training loop with 2-phase training:
    Phase 1 — frozen backbone, head only
    Phase 2 — unfreeze upper backbone, full fine-tuning
    """
    if not TORCH_AVAILABLE:
        logger.error("PyTorch not available. Cannot train.")
        return

    cfg = {**CONFIG, **(config or {})}
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Training on: %s", device)

    # ── Paths ──────────────────────────────────────────────────────────────
    dataset_path = Path(dataset_dir) if dataset_dir else PROJECT_ROOT / "datasets"
    out_dir = Path(output_dir) if output_dir else (MODELS_CHECKPOINTS_DIR / "disease")
    out_dir.mkdir(parents=True, exist_ok=True)

    # ── Datasets ───────────────────────────────────────────────────────────
    train_dataset = LeafDiseaseDataset(dataset_path / "images" / "train", split="train")
    val_dataset   = LeafDiseaseDataset(dataset_path / "images" / "val",   class_names=train_dataset.class_names, split="val")
    test_dataset  = LeafDiseaseDataset(dataset_path / "images" / "test",  class_names=train_dataset.class_names, split="test")

    train_loader = DataLoader(train_dataset, batch_size=cfg["batch_size"], shuffle=True,
                              num_workers=cfg["num_workers"], pin_memory=True)
    val_loader   = DataLoader(val_dataset, batch_size=cfg["batch_size"] * 2, shuffle=False,
                              num_workers=cfg["num_workers"])
    test_loader  = DataLoader(test_dataset, batch_size=cfg["batch_size"] * 2, shuffle=False,
                              num_workers=cfg["num_workers"])

    # ── Model ──────────────────────────────────────────────────────────────
    model = build_disease_classifier(
        num_classes=len(train_dataset.class_names),
        pretrained=True,
        class_names=train_dataset.class_names
    ).to(device)

    # ── Class weighting (imbalance handling) ───────────────────────────────
    class_weights = compute_class_weights(train_dataset).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    scaler = GradScaler() if cfg["fp16"] and torch.cuda.is_available() else None

    # ── MLflow run ────────────────────────────────────────────────────────
    if MLFLOW_AVAILABLE:
        mlflow.set_experiment("DiseaseClassifier")
        run = mlflow.start_run(run_name=f"efficientnet_b3_{int(time.time())}")
        mlflow.log_params({**cfg, "device": str(device), "model_version": MODEL_VERSION,
                           "dataset_version": DATASET_VERSION})
    else:
        run = None

    best_val_f1 = 0.0
    best_epoch  = 0

    # ═══════════════ PHASE 1: Frozen backbone ═════════════════════════════
    logger.info("Phase 1: Training head only (frozen backbone) for %d epochs", cfg["freeze_epochs"])
    for param in model.features.parameters():
        param.requires_grad = False

    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()),
                            lr=cfg["initial_lr"], weight_decay=cfg["weight_decay"])
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=cfg["freeze_epochs"])

    for epoch in range(cfg["freeze_epochs"]):
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, scaler, device)
        val_metrics = evaluate(model, val_loader, device, train_dataset.class_names)
        scheduler.step()
        logger.info("P1 Epoch %d | train_loss=%.4f | val_f1=%.4f | val_acc=%.4f",
                    epoch + 1, train_loss, val_metrics.get("f1_macro", 0), val_metrics["accuracy"])
        if MLFLOW_AVAILABLE and run:
            mlflow.log_metrics({"p1_train_loss": train_loss, **{f"p1_{k}": v for k, v in val_metrics.items()
                                 if isinstance(v, (int, float)) and v is not None}}, step=epoch)

    # ═══════════════ PHASE 2: Fine-tune upper backbone ════════════════════
    logger.info("Phase 2: Fine-tuning (unfreeze all) for %d epochs", cfg["finetune_epochs"])
    for param in model.parameters():
        param.requires_grad = True

    optimizer = optim.AdamW(model.parameters(), lr=cfg["finetune_lr"], weight_decay=cfg["weight_decay"])
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=cfg["finetune_epochs"], eta_min=1e-6)

    no_improve_count = 0

    for epoch in range(cfg["finetune_epochs"]):
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, scaler, device)
        val_metrics = evaluate(model, val_loader, device, train_dataset.class_names)
        scheduler.step()

        val_f1 = val_metrics.get("f1_macro", 0.0) or 0.0
        logger.info("P2 Epoch %d | train_loss=%.4f | val_f1=%.4f | val_roc=%.4f",
                    epoch + 1, train_loss, val_f1, val_metrics.get("roc_auc") or 0.0)

        if MLFLOW_AVAILABLE and run:
            mlflow.log_metrics({"p2_train_loss": train_loss, **{f"p2_{k}": v for k, v in val_metrics.items()
                                 if isinstance(v, (int, float)) and v is not None}},
                               step=cfg["freeze_epochs"] + epoch)

        # Save best model
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_epoch  = epoch + 1
            no_improve_count = 0
            torch.save(model.state_dict(), out_dir / "best_model.pth")
            logger.info("Saved best model at epoch %d (val_f1=%.4f)", best_epoch, best_val_f1)
        else:
            no_improve_count += 1
            if no_improve_count >= cfg["patience"]:
                logger.info("Early stopping at epoch %d (no improvement for %d epochs)",
                            epoch + 1, cfg["patience"])
                break

    # ── Temperature Calibration ────────────────────────────────────────────
    if cfg["temperature_calibration"]:
        logger.info("Running temperature calibration on validation set...")
        model.load_state_dict(torch.load(out_dir / "best_model.pth", map_location=device, weights_only=True))
        best_temp = temperature_calibrate(model, val_loader, device)
        with torch.no_grad():
            model.temperature.fill_(best_temp)
        torch.save(model.state_dict(), out_dir / "best_model_calibrated.pth")
        logger.info("Calibrated model saved. Temperature=%.3f", best_temp)

    # ── Independent Test Set Evaluation ───────────────────────────────────
    logger.info("Evaluating on isolated test set...")
    model.load_state_dict(torch.load(out_dir / "best_model_calibrated.pth", map_location=device, weights_only=True))
    test_metrics = evaluate(model, test_loader, device, train_dataset.class_names)
    logger.info("Test set metrics: %s", json.dumps({k: v for k, v in test_metrics.items()
                if k not in ("confusion_matrix", "per_class")}, indent=2))

    # Save class names + metadata
    metadata = {
        "model_version": MODEL_VERSION,
        "dataset_version": DATASET_VERSION,
        "backbone": cfg["backbone"],
        "class_names": train_dataset.class_names,
        "best_epoch": best_epoch,
        "best_val_f1": round(best_val_f1, 4),
        "test_metrics": {k: v for k, v in test_metrics.items() if k not in ("confusion_matrix", "per_class")},
        "calibrated_temperature": float(model.temperature.item())
    }
    with open(out_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    if MLFLOW_AVAILABLE and run:
        mlflow.log_metrics({f"test_{k}": v for k, v in test_metrics.items()
                             if isinstance(v, (int, float)) and v is not None})
        mlflow.log_artifact(str(out_dir / "metadata.json"))
        mlflow.end_run()

    logger.info("Training complete. Best val F1: %.4f | Test metrics saved to %s", best_val_f1, out_dir)
    return metadata


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train EfficientNet-B3 Disease Classifier")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to dataset root")
    parser.add_argument("--output-dir", type=str, default=None, help="Path to save checkpoints")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()
    train(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        config={"batch_size": args.batch_size, "initial_lr": args.lr}
    )
