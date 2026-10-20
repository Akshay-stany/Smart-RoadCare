import os
from pathlib import Path

# Edge agent configuration (stored locally, never committed)
API_BASE_URL = os.environ.get("ROADCARE_API_URL", "http://localhost:5000/api/v1")
AUTH_TOKEN = os.environ.get("ROADCARE_API_TOKEN", "") # Bearer JWT token from citizen/admin account
VEHICLE_ID = os.environ.get("VEHICLE_ID", "CIVIC-PATROL-01")
CAMERA_ID = os.environ.get("CAMERA_ID", "DASHCAM-FRONT-UVC")

# Camera Source: Integer (e.g., 0 for USB/UVC webcam) or RTSP URL string (e.g., 'rtsp://user:pass@192.168.1.50:554/live')
CAMERA_SOURCE = os.environ.get("CAMERA_SOURCE", "0")
try:
    CAMERA_SOURCE = int(CAMERA_SOURCE)
except ValueError:
    pass # Keep as RTSP stream URL string

SAMPLING_FPS = float(os.environ.get("SAMPLING_FPS", "1.0")) # 1 frame per second
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "75.0"))
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000")
