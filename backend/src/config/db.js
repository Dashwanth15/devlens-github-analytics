/**
 * db.js - MySQL Connection Pool
 *
 * WHY A POOL (not a single connection)?
 * A connection pool maintains multiple reusable connections.
 * Under load, instead of opening a new connection per request (expensive),
 * requests borrow an existing connection from the pool and return it when done.
 * This is standard production practice.
 *
 * WHY mysql2/promise?
 * Allows async/await syntax instead of callbacks - cleaner, modern code.
 */

const mysql = require("mysql2/promise");
const env = require("./env");

// Create the connection pool config
const poolConfig = {
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  waitForConnections: true, // Queue requests when all connections are busy
  connectionLimit: 10,      // Max 10 simultaneous connections
  queueLimit: 0,            // 0 = unlimited queue
  timezone: "+00:00",       // Store all times in UTC
  enableKeepAlive: true,    // Prevent remote MySQL from closing idle connections
  keepAliveInitialDelay: 10000,
};

// Add SSL parameters if enabled
if (env.db.ssl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = mysql.createPool(poolConfig);

/**
 * Test the database connection at startup.
 * If DB is unreachable, retry with exponential backoff before failing.
 */
const testConnection = async (retries = 5, delay = 2000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log("✅ MySQL connected successfully");
      connection.release(); // Always release back to pool
      return;
    } catch (error) {
      console.error(`⚠️ MySQL connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error("❌ MySQL connection failed permanently. Exiting...");
        process.exit(1);
      }
      console.log(`Waiting ${delay / 1000}s before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
};

module.exports = { pool, testConnection };
