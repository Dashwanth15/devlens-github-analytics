/**
 * pdf.service.js - PDF Text Extraction
 *
 * RESPONSIBILITY: Accept a Buffer, return clean text string.
 * No AI, no DB — pure file processing.
 *
 * The downstream resume.service.js only sees clean text,
 * not caring whether it came from a PDF, .txt, or pasted input.
 */

const pdfParse = require("pdf-parse");

const MAX_TEXT_LENGTH = 50000; // Prevent oversized AI prompts

/**
 * Extract readable text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer from multer
 * @param {string} [mimetype] - File MIME type
 * @returns {string} Cleaned extracted text
 */
const extractTextFromBuffer = async (buffer, mimetype = "application/pdf") => {
  try {
    // If plain text file was uploaded, just decode it
    if (mimetype === "text/plain") {
      const text = buffer.toString("utf-8");
      return normalizeText(text);
    }

    // Parse PDF
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("Could not extract text from PDF. The file may be image-based or empty.");
    }

    return normalizeText(data.text);
  } catch (err) {
    if (err.message.includes("Could not extract")) throw err;
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
};

/**
 * Clean and normalize extracted text
 * @param {string} raw - Raw extracted text
 * @returns {string} Normalized text
 */
const normalizeText = (raw) => {
  return raw
    .replace(/\r\n/g, "\n")          // Normalize line endings
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")      // Collapse multiple spaces/tabs
    .replace(/\n{3,}/g, "\n\n")      // Max 2 consecutive blank lines
    .trim()
    .slice(0, MAX_TEXT_LENGTH);       // Truncate for AI safety
};

module.exports = { extractTextFromBuffer };
