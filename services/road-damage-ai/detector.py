import io
import time
from typing import Dict, Any, Optional
from PIL import Image
try:
    from .config import MODEL_PATH, CONFIDENCE_THRESHOLD, is_model_weights_available
    from .classes import RDD_CLASS_MAP
except ImportError:
    from config import MODEL_PATH, CONFIDENCE_THRESHOLD, is_model_weights_available
    from classes import RDD_CLASS_MAP

class RoadDamageDetector:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._try_load_model()

    def _try_load_model(self):
        if not is_model_weights_available():
            self.model_loaded = False
            return

        try:
            # Try loading Ultralytics YOLO model if installed and weights exist
            from ultralytics import YOLO
            self.model = YOLO(MODEL_PATH)
            self.model_loaded = True
        except Exception as e:
            self.model_loaded = False
            self.load_error = str(e)

    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze an image buffer for road damage defects.
        Returns explicit model_available status if weights are missing.
        """
        start_time = time.time()

        # Validate image payload
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            # Reopen for reading after verify()
            image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            raise ValueError("Corrupt, invalid, or unsupported image format.")

        width, height = image.size

        # Check weights availability
        if not self.model_loaded:
            return {
                "model_available": False,
                "model_name": "RoadDamage-YOLOv8",
                "model_version": "v1.2.0-rdd",
                "error": "Model weights file not configured or absent on server.",
                "hint": f"Place trained PyTorch weights at {MODEL_PATH} or train using train.py.",
                "inference_time_ms": round((time.time() - start_time) * 1000),
            }

        # Run real model inference
        results = self.model.predict(
            image,
            conf=CONFIDENCE_THRESHOLD,
            verbose=False
        )

        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item()) * 100
                xyxyn = box.xyxyn[0].tolist() # [xmin, ymin, xmax, ymax] normalized

                cls_meta = RDD_CLASS_MAP.get(cls_id, {
                    "name": "Road Defect",
                    "category": "road_damage",
                    "default_severity": "Medium",
                })

                detections.append({
                    "class_id": cls_id,
                    "name": cls_meta["name"],
                    "category": cls_meta["category"],
                    "confidence": round(conf, 1),
                    "severity": cls_meta["default_severity"],
                    "bounding_box": {
                        "x": round(xyxyn[0], 4),
                        "y": round(xyxyn[1], 4),
                        "width": round(xyxyn[2] - xyxyn[0], 4),
                        "height": round(xyxyn[3] - xyxyn[1], 4),
                    },
                })

        # Sort detections by confidence descending
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        primary = detections[0] if detections else None

        return {
            "model_available": True,
            "model_name": "RoadDamage-YOLOv8",
            "model_version": "v1.2.0-rdd",
            "inference_time_ms": round((time.time() - start_time) * 1000),
            "primaryDefect": primary,
            "detectedObjects": detections,
            "image_dimensions": {"width": width, "height": height},
        }

detector = RoadDamageDetector()
