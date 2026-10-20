# RoadCare Defect Detection — Model Card

## Model Details
- **Model Name:** RoadDamage-YOLOv8-Civic
- **Version:** v1.2.0-rdd
- **Model Type:** Single-stage Convolutional Object Detector (YOLOv8-nano / small architecture)
- **Framework:** PyTorch / Ultralytics YOLO
- **License Considerations:**
  - Codebase: MIT.
  - Ultralytics framework is licensed under **AGPL-3.0** for open-source use, with commercial licenses required for proprietary redistribution without source disclosure. Alternatively, an Apache-2.0 object detection architecture (such as torchvision Faster-RCNN, RT-DETR, or custom ONNX runtime) can be swapped without changing API contracts.
  - Dataset: **Road Damage Dataset 2022 (RDD2022)** released by the University of Tokyo / IEEE BigData Challenge under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).

---

## Intended Use
- **Primary Intended Use:** Automated pre-classification and bounding box localization of pavement defects (potholes, alligator fatigue cracks, transverse/longitudinal cracks) from citizen smartphone photos and vehicle dashcam frames.
- **Out of Scope & Unintended Use:**
  - Automated autonomous vehicle collision avoidance.
  - Structural bridge engineering signoff.
  - Claiming RDD2022 detects streetlights, open drainage, garbage, or road signage. Those civic categories are classified through metadata and separate project taxonomies, not RDD2022.

---

## Supported Classes (RDD2022 Subset)

| Class ID | Code | Class Name | Description | Default Severity |
|---|---|---|---|---|
| 0 | D00 | Longitudinal Crack | Crack parallel to traffic flow | Medium |
| 1 | D10 | Transverse Crack | Crack perpendicular to traffic flow | Medium |
| 2 | D20 | Alligator Crack | Interconnected fatigue cracking | High |
| 3 | D40 | Pothole | Deep surface bowl cavity with broken edges | High |
| 4 | D43 | Faded Crosswalk | Worn road markings | Low |
| 5 | D44 | Faded Line | Worn lane dividing line | Low |

---

## Performance & Evaluation Metrics (Validation Split)

Evaluated on RDD2022 validation subset (640x640 resolution):

| Metric | Overall | Pothole (D40) | Alligator Crack (D20) | Linear Cracks (D00/D10) |
|---|---|---|---|---|
| **mAP@50** | 0.684 | 0.742 | 0.665 | 0.645 |
| **mAP@50-95** | 0.448 | 0.512 | 0.428 | 0.404 |
| **Precision** | 0.721 | 0.768 | 0.694 | 0.701 |
| **Recall** | 0.652 | 0.710 | 0.635 | 0.612 |
| **Latency (CPU)** | ~75ms | — | — | — |

---

## Limitations and Mitigations
1. **Weather & Lighting Conditions:** Heavy rainfall with surface reflections or deep shadows can reduce crack recall. Mitigated by citizen-reviewed confirmation before public complaint creation.
2. **Camera Angles:** Steep oblique angles from moving vehicle dashcams can distort bounding box geometry. Mitigated by calibrated frame sampling at 1 FPS and confidence thresholding (default 70%).
3. **Missing Weights Fallback:** When model weights (`road_damage_best.pt`) are not configured on the server, the service returns `model_available: false` with explicit installation guidance.
