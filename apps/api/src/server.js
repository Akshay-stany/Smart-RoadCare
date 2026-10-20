import app from "./app.js";
import { config } from "./config/env.js";

const server = app.listen(config.port, () => {
  console.log(`[RoadCare API] Server listening on http://localhost:${config.port}`);
  console.log(`[RoadCare API] Environment: ${config.nodeEnv}`);
  console.log(`[RoadCare API] Allowed Web Origin: ${config.webOrigin}`);
});

function gracefulShutdown(signal) {
  console.log(`[RoadCare API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("[RoadCare API] HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
