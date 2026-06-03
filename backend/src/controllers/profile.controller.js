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
      message: `Profile for '${username}' already exists. Showing stored data.`,
      alreadyExists: true,
      data: {
        profile: result.profile,
        repositories: result.repositories,
      },
    });
  }

  return res.status(201).json({
    success: true,
    message: `Profile for '${username}' analyzed and saved successfully.`,
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
// GET /api/profiles?page=1&limit=10
// Returns all analyzed profiles with pagination
// ─────────────────────────────────────────────────────────────
const getAllProfiles = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

  const result = await profileRepository.findAll(page, limit);

  return res.status(200).json({
    success: true,
    message: "Profiles fetched successfully.",
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/profiles/:username
// Returns a single profile with all repositories
// ─────────────────────────────────────────────────────────────
const getProfileByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  let profile = await profileRepository.findByUsernameWithRepos(username);

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: `Profile for '${username}' not found. Use POST /api/profiles/analyze to analyze it first.`,
    });
  }

  // Auto-refresh profile if the cached data is older than 10 minutes
  const cacheDurationMs = 10 * 60 * 1000;
  const isStale = new Date() - new Date(profile.analyzed_at) > cacheDurationMs;

  if (isStale) {
    try {
      console.log(`Auto-refreshing stale profile for ${username} (analyzed at ${profile.analyzed_at})...`);
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
  deleteProfile,
};
