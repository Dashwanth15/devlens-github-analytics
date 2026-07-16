/**
 * env.js - Centralized Environment Configuration
 *
 * Validates all required env vars at startup (fail-fast principle).
 * Single source of truth for all configuration.
 */

const dotenv = require("dotenv");

// Load .env file into process.env
dotenv.config();

// List of required environment variables
const REQUIRED_VARS = ["MONGODB_URI", "GITHUB_TOKEN"];
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
    process.exit(1);
  }
});

module.exports = {
  port:    parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  github: {
    token:   process.env.GITHUB_TOKEN,
    baseUrl: "https://api.github.com",   // ← was missing, caused "Invalid URL"
    maxRepos: parseInt(process.env.GITHUB_MAX_REPOS, 10) || 200,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
  },
  clientUrl: process.env.CLIENT_URL || "",
};
