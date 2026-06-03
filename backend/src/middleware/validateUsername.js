/**
 * validateUsername.js - Input Validation Middleware
 *
 * WHY VALIDATE INPUTS?
 * Never trust user input. Validate before it hits business logic.
 * GitHub usernames have specific rules we can enforce.
 *
 * GitHub username rules:
 * - 1–39 characters
 * - Only alphanumeric + hyphens
 * - Cannot start or end with hyphen
 * - No consecutive hyphens
 */

const validateUsername = (req, res, next) => {
  // Get username from body (POST) or params (GET/DELETE)
  const username = req.body?.username || req.params?.username;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "GitHub username is required.",
    });
  }

  const trimmed = username.trim();

  // Length check
  if (trimmed.length < 1 || trimmed.length > 39) {
    return res.status(400).json({
      success: false,
      message: "GitHub username must be between 1 and 39 characters.",
    });
  }

  // Valid character check (alphanumeric + hyphens)
  const validUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  if (!validUsernameRegex.test(trimmed)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid GitHub username. Only letters, numbers, and hyphens allowed. Cannot start or end with a hyphen.",
    });
  }

  // Attach cleaned username back to request
  if (req.body) {
    req.body.username = trimmed;
  }
  if (req.params) {
    req.params.username = trimmed;
  }

  next();
};

module.exports = validateUsername;
