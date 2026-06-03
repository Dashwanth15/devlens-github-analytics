/**
 * errorHandler.js - Global Error Handling Middleware
 *
 * WHY CENTRALIZED ERROR HANDLING?
 * Without this, every controller needs try/catch + manual res.json().
 * With this, controllers just throw errors and this catches everything.
 *
 * Express recognizes a 4-argument middleware as error handler.
 * Must be registered LAST in app.js (after all routes).
 */

const env = require("../config/env");

const errorHandler = (err, req, res, next) => {
  // Log error details server-side (never expose stack traces to client)
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
  if (env.isDevelopment) {
    console.error(err.stack);
  }

  // Determine the correct HTTP status code
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "This profile has already been analyzed.";
  }

  if (err.message?.includes("not found")) {
    statusCode = 404;
  }

  if (err.message?.includes("rate limit")) {
    statusCode = 429;
  }

  if (err.message?.includes("Invalid GitHub token")) {
    statusCode = 401;
  }

  // Map CORS block errors to 403 Forbidden
  if (err.message?.includes("CORS blocked")) {
    statusCode = 403;
  }

  // Map Multer file upload errors to 400 Bad Request
  if (err.name === "MulterError" || err.message?.includes("allowed for resume upload")) {
    statusCode = 400;
    if (err.name === "MulterError") {
      message = `File upload failed: ${err.message}`;
    }
  }

  // Identify database errors (syntax errors, connection dropouts, host lookup errors)
  const isDbError = !!(
    err.sqlState ||
    (err.code && (err.code.startsWith("ER_") || ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "PROTOCOL_CONNECTION_LOST"].includes(err.code)))
  );

  // In production, sanitize 5xx and database error messages to prevent exposing system details
  const responseMessage =
    (statusCode >= 500 || isDbError) && env.isProduction
      ? "An unexpected error occurred. Please try again later."
      : message;

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    ...(env.isDevelopment && { stack: err.stack }), // Only in dev
  });
};

module.exports = errorHandler;
