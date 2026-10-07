/**
 * validateUsername.js - Input Validation Middleware
 * Normalizes input: handles raw usernames, @handles, and full GitHub URLs.
 */

const { extractUsername, isValidGitHubUsername } = require("../utils/githubUtils");

const validateUsername = (req, res, next) => {
  const rawInput = req.body?.username || req.params?.username || req.query?.username;

  if (!rawInput) {
    return res.status(400).json({
      success: false,
      message: "GitHub username or profile URL is required.",
    });
  }

  const normalized = extractUsername(rawInput);

  if (!normalized || !isValidGitHubUsername(normalized)) {
    return res.status(400).json({
      success: false,
      message: "Invalid GitHub username or URL. Please provide a valid GitHub handle or profile link.",
    });
  }

  // Attach cleaned canonical username back to request
  if (req.body) {
    req.body.username = normalized;
  }
  if (req.params) {
    req.params.username = normalized;
  }
  if (req.query) {
    req.query.username = normalized;
  }

  next();
};

module.exports = validateUsername;
