/**
 * db.js - MongoDB Connection via Mongoose
 *
 * WHY MONGOOSE?
 * Mongoose provides schema validation, model abstraction,
 * and a clean async/await API on top of the MongoDB driver.
 * It replaces the old MySQL2 connection pool entirely.
 */

const mongoose = require("mongoose");
const env = require("./env");

let isConnected = false;

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if no server found
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Test the connection (used in server.js startup check)
 */
const testConnection = async () => {
  await connectDB();
  console.log("✅ Database connection verified");
};

module.exports = { connectDB, testConnection };
