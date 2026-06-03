/**
 * profile.routes.js - Route Definitions
 *
 * Maps HTTP methods + paths to controller functions.
 * Middleware (validateUsername) is applied per-route, not globally.
 *
 * API Design:
 * POST   /api/profiles/analyze       → Analyze a new profile
 * POST   /api/profiles/refresh       → Force re-analyze existing profile
 * GET    /api/profiles               → Get all profiles (paginated)
 * GET    /api/profiles/:username     → Get single profile + repos
 * DELETE /api/profiles/:username     → Delete a profile
 */

const express = require("express");
const router = express.Router();

const controller = require("../controllers/profile.controller");
const validateUsername = require("../middleware/validateUsername");

// ── Analysis endpoints ────────────────────────────────────────
router.post("/analyze", validateUsername, controller.analyzeProfile);
router.post("/refresh", validateUsername, controller.refreshProfile);

// ── Read endpoints ────────────────────────────────────────────
router.get("/", controller.getAllProfiles);
router.get("/:username", validateUsername, controller.getProfileByUsername);

// ── Delete endpoint ───────────────────────────────────────────
router.delete("/:username", validateUsername, controller.deleteProfile);

module.exports = router;
