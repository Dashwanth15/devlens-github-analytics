/**
 * career.routes.js
 * GET  /api/career/:username         → Get or compute career prediction
 * POST /api/career/:username/refresh → Force recompute
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/career.controller");
const validateUsername = require("../middleware/validateUsername");

router.get("/:username",         validateUsername, controller.getCareerPrediction);
router.post("/:username/refresh", validateUsername, controller.refreshCareerPrediction);

module.exports = router;
