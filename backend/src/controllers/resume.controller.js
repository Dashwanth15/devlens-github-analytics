/**
 * resume.controller.js - Resume Analysis HTTP Handlers
 */

const resumeService = require("../services/resume.service");
const resumeRepository = require("../repositories/resume.repository");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/resume/analyze  (multipart/form-data: file + username)
const analyzeResume = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: "GitHub username is required." });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Resume file (PDF or .txt) is required." });
  }

  const result = await resumeService.analyzeResume(
    username.trim().toLowerCase(),
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  return res.status(201).json({
    success: true,
    message: `Resume for '${username}' analyzed successfully.`,
    data: result,
  });
});

// POST /api/resume/analyze-text  (JSON: { username, text })
const analyzeResumeText = asyncHandler(async (req, res) => {
  const { username, text } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: "GitHub username is required." });
  }
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ success: false, message: "Resume text must be at least 50 characters." });
  }

  const result = await resumeService.analyzeResumeText(
    username.trim().toLowerCase(),
    text.trim()
  );

  return res.status(201).json({
    success: true,
    message: `Resume text for '${username}' analyzed successfully.`,
    data: result,
  });
});

// GET /api/resume/:username
const getResumeAnalysis = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const analysis = await resumeRepository.findByUsername(username);
  if (!analysis) {
    return res.status(404).json({
      success: false,
      message: `No resume analysis found for '${username}'. Upload a resume first.`,
    });
  }
  return res.status(200).json({ success: true, data: analysis });
});

// DELETE /api/resume/:username
const deleteResumeAnalysis = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const deleted = await resumeRepository.deleteByUsername(username);
  if (!deleted) {
    return res.status(404).json({ success: false, message: `No resume analysis found for '${username}'.` });
  }
  return res.status(200).json({ success: true, message: `Resume analysis for '${username}' deleted.` });
});

module.exports = { analyzeResume, analyzeResumeText, getResumeAnalysis, deleteResumeAnalysis };
