# RoadCare Vehicle Camera Edge Agent

This service allows authorized municipal inspection vehicles, patrol cars, or local road test rigs to automatically detect road damage while driving, without requiring manual driver interaction.

## Hardware Support & Architecture

### Two Ingestion Paths:
1. **Webcam / Browser Camera (Accessible Path):**
   - Available directly in the web app under `/live-detection`.
   - Uses the browser's standard `navigator.mediaDevices.getUserMedia()` API.
   - Works with any USB webcam or smartphone camera on localhost or secure HTTPS.
   - Requires no extra Python installation on the client.

2. **Vehicle Camera Edge Agent (Physical Vehicle Path):**
   - Runs locally in Python on an onboard vehicle computer (Raspberry Pi 4/5, Nvidia Jetson, or field laptop).
   - **Supported Hardware:**
     - **USB/UVC Webcams:** Any standard class-compliant USB camera (e.g., Logitech C920/Brio, wide-angle UVC industrial camera) recognized as a video device (index `0`, `1`).
     - **RTSP IP Cameras:** Authorized commercial or fleet dashcams configured with an accessible RTSP video feed URL (e.g., `rtsp://user:pass@192.168.1.100:554/live`).
   - **Hardware Limitations (Important):**
     - Consumer dashcams without RTSP streaming, open Wi-Fi live feeds, or USB webcam mode **cannot** be directly accessed in real time.
     - For standalone consumer dashcams, extract the recorded MP4 video and analyze it via the upload tool in the web application.

---

## Driver Safety Policy
> **CAUTION:** Never operate or interact with the screen or camera controls while driving.
> All candidate road defects are recorded as candidate events. Drivers or municipal coordinators review and convert events into public complaints only when safely parked.

---

## Configuration & Run

```bash
cd services/vehicle-camera-agent
cp .env.example .env
pip install opencv-python

python agent.py
```
