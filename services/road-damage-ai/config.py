import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Configurable environment variables
MODEL_PATH = os.environ.get("MODEL_PATH", str(BASE_DIR / "models" / "road_damage_best.pt"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.55"))
IOU_THRESHOLD = float(os.environ.get("IOU_THRESHOLD", "0.45"))
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")

def is_model_weights_available() -> bool:
    """Checks whether the configured model weight file exists on disk."""
    p = Path(MODEL_PATH)
    return p.exists() and p.is_file() and p.stat().st_size > 1024
