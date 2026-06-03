/**
 * resume.routes.js
 * POST /api/resume/analyze       → PDF upload + GitHub username
 * POST /api/resume/analyze-text  → Plain text paste + GitHub username
 * GET  /api/resume/:username     → Get stored analysis
 * DELETE /api/resume/:username   → Delete analysis
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/resume.controller");
const upload = require("../middleware/upload.middleware");
const validateUsername = require("../middleware/validateUsername");

router.post("/analyze",      upload.single("file"), validateUsername, controller.analyzeResume);
router.post("/analyze-text", validateUsername, controller.analyzeResumeText);
router.get("/:username",     validateUsername, controller.getResumeAnalysis);
router.delete("/:username",  validateUsername, controller.deleteResumeAnalysis);

module.exports = router;
