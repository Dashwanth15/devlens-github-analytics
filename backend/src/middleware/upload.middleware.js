/**
 * upload.middleware.js - Multer File Upload Configuration
 *
 * Uses memoryStorage: the PDF is held in RAM as a Buffer.
 * We extract text then discard the buffer — no files saved to disk.
 * This is intentional: we store the extracted TEXT in MySQL, not the PDF.
 */

const multer = require("multer");

// Store files in memory as Buffer (no disk I/O)
const storage = multer.memoryStorage();

// Filter: only allow PDF files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "text/plain"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and .txt files are allowed for resume upload."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,                    // Only 1 file per request
  },
});

module.exports = upload;
