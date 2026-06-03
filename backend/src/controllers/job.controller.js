/**
 * job.controller.js - Job Match Engine HTTP Handlers
 */

const jobService = require("../services/job.service");
const jobRepository = require("../repositories/job.repository");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/jobs/match
const matchJob = asyncHandler(async (req, res) => {
  const { username, jobDescription, jobTitle } = req.body;
  const result = await jobService.matchJob(username, jobDescription, jobTitle);
  return res.status(result.cached ? 200 : 201).json({
    success: true,
    message: result.cached
      ? "Job match retrieved from cache."
      : `Job match analysis complete for '${username}'.`,
    data: result,
  });
});

// GET /api/jobs/:username  — paginated history of job matches
const getJobMatches = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 10);
  const result = await jobRepository.findByUsername(username, page, limit);
  return res.status(200).json({
    success: true,
    message: "Job analyses retrieved.",
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    },
  });
});

// GET /api/jobs/:username/:id  — single job analysis detail
const getJobMatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const analysis = await jobRepository.findById(id);
  if (!analysis) {
    return res.status(404).json({ success: false, message: "Job analysis not found." });
  }
  return res.status(200).json({ success: true, data: analysis });
});

// DELETE /api/jobs/:id
const deleteJobMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await jobRepository.deleteById(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Job analysis not found." });
  }
  return res.status(200).json({ success: true, message: "Job analysis deleted." });
});

module.exports = { matchJob, getJobMatches, getJobMatchById, deleteJobMatch };
