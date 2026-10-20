export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Structured logging (no sensitive credentials or tokens printed)
  console.error(`[API ERROR] ${req.method} ${req.url} [${status}]:`, {
    message,
    path: req.path,
    requestId: req.headers["x-request-id"] || undefined,
  });

  res.status(status).json({
    success: false,
    error: message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  });
}
