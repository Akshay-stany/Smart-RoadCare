import { Router } from "express";
import { config } from "../config/env.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "RoadCare Express API",
    version: "2.0.0",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    supabaseConfigured: Boolean(config.supabaseUrl && !config.supabaseUrl.includes("placeholder")),
  });
});

export default router;
