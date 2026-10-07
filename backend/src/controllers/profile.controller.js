/**
 * profile.controller.js - Request/Response Handling Layer
 *
 * RESPONSIBILITY:
 * - Parse incoming HTTP requests
 * - Call the appropriate service
 * - Send back structured HTTP responses
 *
 * Controllers do NOT contain business logic or SQL.
 * They are thin wrappers around services.
 *
 * asyncHandler pattern: wraps async functions so any thrown
 * error is automatically forwarded to the global error handler.
 */

const analyzerService = require("../services/analyzer.service");
const profileRepository = require("../repositories/profile.repository");

/**
 * Helper: wraps async route handlers to avoid try/catch repetition.
 * Any unhandled promise rejection is passed to next() → errorHandler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─────────────────────────────────────────────────────────────
// POST /api/profiles/analyze
// Body: { "username": "torvalds" }
// ─────────────────────────────────────────────────────────────
const analyzeProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const result = await analyzerService.analyzeProfile(username);

  if (result.alreadyExists) {
    return res.status(200).json({
      success: true,
      message: `Profile for '${username}' updated to top of queue.`,
      alreadyExists: true,
      data: {
        profile: result.profile,
        repositories: result.repositories,
      },
    });
  }

  return res.status(201).json({
    success: true,
    message: `Profile for '${username}' analyzed and saved to queue.`,
    alreadyExists: false,
    data: {
      profile: result.profile,
      repositories: result.repositories,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/profiles/refresh
// Body: { "username": "torvalds" }
// Force re-fetch from GitHub (overrides duplicate check)
// ─────────────────────────────────────────────────────────────
const refreshProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const result = await analyzerService.refreshProfile(username);

  return res.status(200).json({
    success: true,
    message: `Profile for '${username}' refreshed successfully.`,
    data: {
      profile: result.profile,
      repositories: result.repositories,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/profiles?page=1&limit=20
// Returns maximum 20 latest analyzed profiles, newest first
// ─────────────────────────────────────────────────────────────
const getAllProfiles = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));

  const result = await profileRepository.findAll(page, limit);

  return res.status(200).json({
    success: true,
    message: "Profiles fetched successfully.",
    data: result.data,
    profiles: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
      maxQueueSize: 20,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/profiles/:username
// Returns a single profile with all repositories
// If not in database, auto-fetches and analyzes from GitHub!
// ─────────────────────────────────────────────────────────────
const getProfileByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  let profile = await profileRepository.findByUsernameWithRepos(username);

  // If not yet in local DB, fetch from GitHub directly (zero prerequisite to pre-save)
  if (!profile) {
    try {
      console.log(`[ProfileController] Profile for '${username}' not in local DB. Auto-fetching from GitHub...`);
      const analyzed = await analyzerService.analyzeProfile(username);
      profile = (await profileRepository.findByUsernameWithRepos(username)) || analyzed.profile;
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: `GitHub profile for '${username}' not found: ${err.message}`,
      });
    }
  }

  // Auto-refresh profile if the cached data is older than 10 minutes
  const cacheDurationMs = 10 * 60 * 1000;
  const isStale = new Date() - new Date(profile.lastAnalyzedAt || profile.analyzed_at) > cacheDurationMs;

  if (isStale) {
    try {
      console.log(`Auto-refreshing stale profile for ${username}...`);
      const refreshed = await analyzerService.refreshProfile(username);
      profile = {
        ...refreshed.profile,
        repositories: refreshed.repositories,
      };
    } catch (err) {
      console.error(`Auto-refresh failed for ${username}:`, err.message);
      // Fallback silently to cached profile if GitHub API or DB call fails (ensures resilience)
    }
  }

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    data: profile,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/profiles/compare
// Body: { username1: "torvalds", username2: "gaearon" }
// Compares any two public GitHub developers (cached or fresh)
// ─────────────────────────────────────────────────────────────
const compareProfiles = asyncHandler(async (req, res) => {
  const { extractUsername, isValidGitHubUsername } = require("../utils/githubUtils");

  const raw1 = req.body.username1 || req.body.dev1 || req.body.left;
  const raw2 = req.body.username2 || req.body.dev2 || req.body.right;

  const u1 = extractUsername(raw1);
  const u2 = extractUsername(raw2);

  if (!u1 || !isValidGitHubUsername(u1)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid GitHub username or profile URL for Developer 1.",
    });
  }

  if (!u2 || !isValidGitHubUsername(u2)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid GitHub username or profile URL for Developer 2.",
    });
  }

  if (u1 === u2) {
    return res.status(400).json({
      success: false,
      message: "Please choose two different developers to compare. You cannot compare a developer with themselves.",
    });
  }

  const loadOrAnalyze = async (uname) => {
    let p = await profileRepository.findByUsernameWithRepos(uname);
    if (!p) {
      const res = await analyzerService.analyzeProfile(uname);
      p = (await profileRepository.findByUsernameWithRepos(uname)) || res.profile;
    }
    return p;
  };

  try {
    const [p1, p2] = await Promise.all([
      loadOrAnalyze(u1),
      loadOrAnalyze(u2),
    ]);

    return res.status(200).json({
      success: true,
      message: `Comparison generated for @${u1} vs @${u2}.`,
      data: {
        developer1: p1,
        developer2: p2,
      },
    });
  } catch (err) {
    const statusCode = err.message?.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to load developer profile for comparison.",
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/profiles/:username
// Removes a profile and its repositories from the DB
// ─────────────────────────────────────────────────────────────
const deleteProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const deleted = await profileRepository.deleteByUsername(username);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: `Profile for '${username}' not found.`,
    });
  }

  return res.status(200).json({
    success: true,
    message: `Profile for '${username}' deleted successfully.`,
  });
});

module.exports = {
  analyzeProfile,
  refreshProfile,
  getAllProfiles,
  getProfileByUsername,
  compareProfiles,
  deleteProfile,
};
