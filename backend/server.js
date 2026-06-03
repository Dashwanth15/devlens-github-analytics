/**
 * server.js - Application Entry Point
 *
 * WHY THIS IS MINIMAL:
 * All configuration is in app.js.
 * server.js only does one thing: start the HTTP server.
 *
 * This makes app.js importable in tests without starting a real server.
 */

const app = require("./src/app");
const env = require("./src/config/env");
const { testConnection } = require("./src/config/db");

let server;

const startServer = async () => {
  try {
    // 1. Verify database connection before accepting traffic
    await testConnection();

    // 2. Start the HTTP server
    server = app.listen(env.port, () => {
      console.log("\n================================================");
      console.log(`  🚀 GitHub Profile Analyzer API`);
      console.log(`  🌍 Environment : ${env.nodeEnv}`);
      console.log(`  📡 Server      : http://localhost:${env.port}`);
      console.log(`  💾 Database    : ${env.db.host}/${env.db.name}`);
      console.log(`  ✅ Health      : http://localhost:${env.port}/api/health`);
      console.log("================================================\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n🤖 Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log("🌐 HTTP server closed.");
    });
  }
  try {
    const { pool } = require("./src/config/db");
    await pool.end();
    console.log("💾 Database pool closed.");
  } catch (err) {
    console.error("Error closing database pool:", err.message);
  }
  process.exit(0);
};

const handleCrash = async (errorType, error) => {
  console.error(`💥 ${errorType}:`, error);
  if (server) {
    server.close();
  }
  try {
    const { pool } = require("./src/config/db");
    await pool.end();
  } catch (err) {
    console.error("Error closing database pool during crash cleanup:", err.message);
  }
  process.exit(1);
};

// Process listeners for signals and uncaught errors
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => handleCrash("Unhandled Rejection", reason));
process.on("uncaughtException", (error) => handleCrash("Uncaught Exception", error));

startServer();
