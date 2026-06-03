/**
 * env.js - Centralized Environment Configuration
 *
 * WHY THIS EXISTS:
 * - Validates all required env vars at startup (fail-fast principle)
 * - Single source of truth for all configuration
 * - Prevents "undefined" bugs from missing env vars
 * - Makes it easy to see ALL config in one place
 */

const dotenv = require("dotenv");

// Load .env file into process.env
dotenv.config();

// List of required environment variables
const REQUIRED_VARS = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "GITHUB_TOKEN"];
const OPTIONAL_VARS = ["GEMINI_API_KEY"];

// Warn (don't crash) for missing optional vars
OPTIONAL_VARS.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`⚠️  Optional env variable missing: ${varName} (some AI features will be disabled)`);
  }
});

// Validate all required vars exist at startup
REQUIRED_VARS.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ FATAL: Missing required environment variable: ${varName}`);
    process.exit(1); // Crash immediately - better than silent failure
  }
});

const env = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",

  // Database
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    ssl: process.env.DB_SSL ? process.env.DB_SSL === "true" : (process.env.NODE_ENV === "production" && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST)),
  },

  // GitHub
  github: {
    token: process.env.GITHUB_TOKEN,
    baseUrl: "https://api.github.com",
    maxRepos: 100, // Maximum repos to fetch per user
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    enabled: !!process.env.GEMINI_API_KEY,
  },

  // CORS
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

module.exports = env;
