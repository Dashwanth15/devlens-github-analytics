/**
 * app.js - Express Application Setup
 *
 * WHY SEPARATE app.js FROM server.js?
 * - app.js configures Express (middleware, routes)
 * - server.js starts the HTTP server (listens on port)
 * - This separation makes testing easier (import app without starting server)
 * - Clean separation of concerns
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");

const profileRoutes = require("./routes/profile.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust reverse proxy (essential for rate limiting client IPs behind Render's load balancer)
app.set("trust proxy", 1);

// ── Security Middleware ───────────────────────────────────────
// Helmet sets secure HTTP headers (prevents common attacks)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests for resources safely
  })
);

// CORS: Allow frontend origins (any localhost port in dev, comma-separated URLs in env)
const clientOrigins = env.clientUrl ? env.clientUrl.split(",").map((url) => url.trim()) : [];
const allowedOrigins = [
  ...clientOrigins,
  /^http:\/\/localhost:\d+$/,  // Allow ANY localhost port (dev)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl) or matching origins
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) =>
        allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
      );
      if (isAllowed) return callback(null, true);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Rate Limiting: Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in 15 minutes.",
  },
});
app.use(limiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "2mb" })); // Increased for large job descriptions
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Health Check Route ────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevLens API is running.",
    environment: env.nodeEnv,
    features: {
      github_analysis: true,
      resume_verification: env.gemini.enabled,
      career_prediction: true,
      job_matching: env.gemini.enabled,
      candidate_ranking: env.gemini.enabled,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/profiles", profileRoutes);
app.use("/api/resume",   require("./routes/resume.routes"));
app.use("/api/career",   require("./routes/career.routes"));
app.use("/api/jobs",     require("./routes/job.routes"));
app.use("/api/ranking",  require("./routes/ranking.routes"));

// ── 404 Handler (unknown routes) ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// ── Global Error Handler (MUST be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
