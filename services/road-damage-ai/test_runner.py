import unittest
import io
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from PIL import Image
from detector import RoadDamageDetector
from classes import RDD_CLASS_MAP

class TestRoadDamageDetector(unittest.TestCase):
    def setUp(self):
        self.detector = RoadDamageDetector()

    def test_class_map_coverage(self):
        self.assertIn(3, RDD_CLASS_MAP)
        self.assertEqual(RDD_CLASS_MAP[3]["name"], "Pothole")
        self.assertEqual(RDD_CLASS_MAP[2]["name"], "Alligator Crack")

    def test_invalid_image_payload_raises_value_error(self):
        bad_bytes = b"not-a-valid-image-format"
        with self.assertRaises(ValueError):
            self.detector.analyze(bad_bytes)

    def test_missing_weights_returns_model_unavailable(self):
        # Create a tiny 100x100 RGB test image
        img = Image.new("RGB", (100, 100), color=(128, 128, 128))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        raw_bytes = buf.getvalue()

        # If model weights are not present, detector must report model_available: False
        if not self.detector.model_loaded:
            result = self.detector.analyze(raw_bytes)
            self.assertFalse(result["model_available"])
            self.assertIn("error", result)

if __name__ == "__main__":
    unittest.main()
