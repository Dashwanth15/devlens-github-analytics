/**
 * validateJobInput.js - Job Description Input Validation Middleware
 */

const validateJobInput = (req, res, next) => {
  const { username, jobDescription } = req.body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "GitHub username is required.",
    });
  }

  if (!jobDescription || typeof jobDescription !== "string") {
    return res.status(400).json({
      success: false,
      message: "Job description is required.",
    });
  }

  const trimmed = jobDescription.trim();
  if (trimmed.length < 50) {
    return res.status(400).json({
      success: false,
      message: "Job description must be at least 50 characters for meaningful analysis.",
    });
  }
  if (trimmed.length > 15000) {
    return res.status(400).json({
      success: false,
      message: "Job description must not exceed 15,000 characters.",
    });
  }

  // Normalize
  req.body.username = username.trim().toLowerCase();
  req.body.jobDescription = trimmed;
  next();
};

module.exports = validateJobInput;
