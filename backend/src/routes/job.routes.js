/**
 * job.routes.js
 * POST   /api/jobs/match           → Run job match analysis
 * GET    /api/jobs/:username       → List all job analyses for a developer
 * GET    /api/jobs/:username/:id   → Get specific analysis detail
 * DELETE /api/jobs/:id             → Delete a job analysis
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/job.controller");
const validateJobInput = require("../middleware/validateJobInput");
const validateUsername = require("../middleware/validateUsername");

router.post("/match",           validateUsername, validateJobInput, controller.matchJob);
router.get("/:username",        validateUsername, controller.getJobMatches);
router.get("/:username/:id",    validateUsername, controller.getJobMatchById);
router.delete("/:id",           controller.deleteJobMatch);

module.exports = router;
