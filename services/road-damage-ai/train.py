"""
Reproducible Training Script for Road Damage Detection (RDD2022)
Usage:
  python train.py --data dataset.yaml --epochs 50 --imgsz 640 --batch 16
"""

import argparse
import sys
from pathlib import Path

def train_model(data_yaml: str, epochs: int = 50, imgsz: int = 640, batch: int = 16, model_size: str = "yolov8n.pt"):
    print(f"[*] Starting RoadCare Road Damage fine-tuning on {data_yaml}...")
    print(f"[*] Base model: {model_size}, Epochs: {epochs}, Batch size: {batch}, Image size: {imgsz}")

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[!] Ultralytics package is not installed. Run: pip install ultralytics")
        sys.exit(1)

    model = YOLO(model_size)

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project="runs/roadcare",
        name="rdd_detector",
        save=True,
    )

    print("[*] Training complete. Evaluating on validation split...")
    metrics = model.val()
    print(f"[*] mAP50-95: {metrics.box.map:.4f}")
    print(f"[*] mAP50: {metrics.box.map50:.4f}")

    best_weights = Path("runs/roadcare/rdd_detector/weights/best.pt")
    if best_weights.exists():
        target_dir = Path(__file__).parent / "models"
        target_dir.mkdir(exist_ok=True)
        import shutil
        shutil.copy(best_weights, target_dir / "road_damage_best.pt")
        print(f"[*] Copied best model weights to {target_dir / 'road_damage_best.pt'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train RoadCare Defect Detector")
    parser.add_argument("--data", type=str, default="rdd2022.yaml", help="Path to dataset YAML")
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_model(args.data, args.epochs, args.imgsz, args.batch)
