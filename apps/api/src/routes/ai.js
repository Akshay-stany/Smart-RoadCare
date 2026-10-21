import { Router } from "express";
import multer from "multer";
import { config } from "../config/env.js";

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are permitted"));
    }
  },
});

// Use the bound environment variable provided by Vercel's bindings, with fallbacks
const aiBaseUrl = process.env.ROAD_DAMAGE_AI_URL || config.aiServiceUrl || "http://localhost:8000";

// 1. AI Health / Model Status
router.get("/status", async (_req, res) => {
  try {
    const healthUrl = new URL("/health", aiBaseUrl);
    const fastApiRes = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(3000) });
    if (fastApiRes.ok) {
      const data = await fastApiRes.json();
      return res.json({ success: true, ...data });
    }
  } catch {
    // FastAPI service not reachable or not yet booted
  }

  res.json({
    success: true,
    modelAvailable: false,
    modelName: "RoadDamage-YOLOv8",
    modelVersion: "v1.2.0-rdd",
    message: "AI road damage detection service is currently offline. Model weights must be placed at services/road-damage-ai/models/road_damage_best.pt or ROAD_DAMAGE_AI_URL configured.",
  });
});

// 2. Road Damage Image Inference
router.post("/analyze-image", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image file is required" });
    }

    const startTime = performance.now();

    // Attempt real inference via FastAPI microservice
    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);

      const analyzeUrl = new URL("/analyze-image", aiBaseUrl);
      const aiResponse = await fetch(analyzeUrl, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(8000),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        return res.json({
          success: true,
          ...aiData,
          inferenceTimeMs: Math.round(performance.now() - startTime),
        });
      }
    } catch {
      // Microservice offline or connection timed out
    }

    // Do NOT return fabricated predictions with fake confidence.
    // Return honest unavailable status so UI can handle it gracefully.
    return res.status(503).json({
      success: false,
      modelAvailable: false,
      error: "AI road damage detection service is currently offline or model weights are unconfigured. Manual complaint reporting remains fully operational.",
      inferenceTimeMs: Math.round(performance.now() - startTime),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
