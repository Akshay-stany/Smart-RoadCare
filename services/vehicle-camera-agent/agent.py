"""
RoadCare Vehicle Camera Edge Agent
Connects to authorized local USB/UVC cameras or RTSP video streams,
samples frames periodically, submits to the AI detection service,
and forwards throttled candidate events to the RoadCare API.
"""

import time
import sys
import io
import json
import urllib.request
import urllib.error
from pathlib import Path
from .config import (
    API_BASE_URL,
    AUTH_TOKEN,
    VEHICLE_ID,
    CAMERA_ID,
    CAMERA_SOURCE,
    SAMPLING_FPS,
    CONFIDENCE_THRESHOLD,
    AI_SERVICE_URL,
)

def run_agent():
    print(f"[*] Starting RoadCare Vehicle Camera Agent for Vehicle: {VEHICLE_ID}")
    print(f"[*] Camera Source: {CAMERA_SOURCE}, Sampling Rate: {SAMPLING_FPS} FPS")

    try:
        import cv2
    except ImportError:
        print("[!] OpenCV (cv2) is required to capture video streams. Install via: pip install opencv-python")
        print("[!] Note: Standard browser webcam mode is available at /live-detection without installing OpenCV.")
        return

    cap = cv2.VideoCapture(CAMERA_SOURCE)
    if not cap.isOpened():
        print(f"[!] Unable to open camera source: {CAMERA_SOURCE}")
        print("[!] For USB webcams, verify the device index (0, 1, ...).")
        print("[!] For RTSP feeds, verify network route and credentials.")
        return

    interval_sec = 1.0 / SAMPLING_FPS
    last_sample_time = 0.0

    print("[*] Stream connected successfully. Sampling frames (Press Ctrl+C to stop)...")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[!] Failed to grab frame from stream. Reconnecting...")
                time.sleep(2)
                cap = cv2.VideoCapture(CAMERA_SOURCE)
                continue

            now = time.time()
            if now - last_sample_time >= interval_sec:
                last_sample_time = now

                # Encode frame as JPEG buffer
                _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                jpeg_bytes = buffer.tobytes()

                # Dispatch frame to AI service or simulated edge evaluator
                detect_and_ingest(jpeg_bytes)

            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n[*] Stopping camera agent gracefully...")
    finally:
        cap.release()
        print("[*] Camera stream closed.")

def detect_and_ingest(image_bytes: bytes):
    """Submits frame to AI service and ingests event if confidence meets threshold."""
    # Attempt to post to AI service
    try:
        boundary = "----WebKitFormBoundaryRoadCareAgent"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="frame.jpg"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode("utf-8") + image_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

        req = urllib.request.Request(
            f"{AI_SERVICE_URL}/analyze-image",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                result = json.loads(response.read().decode("utf-8"))
                primary = result.get("primaryDefect")
                if primary and primary.get("confidence", 0) >= CONFIDENCE_THRESHOLD:
                    print(f"[+] Detected {primary['label']} ({primary['confidence']}%) - Sending event to RoadCare API")
                    send_event_to_api(primary)
    except Exception:
        # Service offline or frame drop
        pass

def send_event_to_api(defect_data: dict):
    """Sends candidate detection event to RoadCare Express API."""
    if not AUTH_TOKEN:
        print("[-] API token not provided. Event logged locally only.")
        return

    try:
        payload = json.dumps({
            "sourceType": "dashcam_agent",
            "vehicleId": VEHICLE_ID,
            "cameraId": CAMERA_ID,
            "detectedClass": defect_data.get("label", "Pothole"),
            "confidence": defect_data.get("confidence", 80),
            "boundingBox": defect_data.get("boundingBox"),
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{API_BASE_URL}/detection-events",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {AUTH_TOKEN}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 201:
                print("[✓] Event successfully ingested into database.")
    except Exception as e:
        print(f"[!] Failed to ingest event: {e}")

if __name__ == "__main__":
    run_agent()
