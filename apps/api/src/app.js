import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import complaintRoutes from "./routes/complaints.js";
import adminRoutes from "./routes/admin.js";
import officerRoutes from "./routes/officer.js";
import aiRoutes from "./routes/ai.js";
import detectionEventRoutes from "./routes/detectionEvents.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowedLocal =
        origin === "http://localhost:8080" ||
        origin === "http://localhost:5173" ||
        origin === "http://localhost:3000" ||
        origin === "http://localhost:4173" ||
        origin === config.webOrigin;
      const isVercel = origin.endsWith(".vercel.app");
      if (isAllowedLocal || isVercel || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate limiting for anti-abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Request ID header middleware
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// JSON and URL-encoded body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root API status endpoint
app.get("/api", (_req, res) => {
  res.json({
    service: "RoadCare Express API",
    status: "healthy",
    version: "2.0.0",
    docs: "/api/v1/health",
  });
});

// Route families
app.use("/api", healthRoutes);
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/officer", officerRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/detection-events", detectionEventRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Catch-all 404 for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
