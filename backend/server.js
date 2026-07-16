/**
 * server.js - Application Entry Point
 *
 * Starts the HTTP server after verifying MongoDB connection.
 */

const app = require("./src/app");
const env = require("./src/config/env");
const { connectDB } = require("./src/config/db");

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB before accepting traffic
    await connectDB();

    // 2. Start the HTTP server
    server = app.listen(env.port, () => {
      console.log("\n================================================");
      console.log(`  🚀 GitHub Profile Analyzer API`);
      console.log(`  🌍 Environment : ${env.nodeEnv}`);
      console.log(`  📡 Server      : http://localhost:${env.port}`);
      console.log(`  💾 Database    : MongoDB Atlas`);
      console.log("================================================\n");
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
