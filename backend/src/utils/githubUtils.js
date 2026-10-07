/**
 * githubUtils.js - Centralized GitHub Username & URL Parsing Utilities
 */

/**
 * Extract canonical GitHub username from raw input string.
 * Handles:
 * - Plain username: "torvalds"
 * - Leading @: "@torvalds"
 * - Full URLs: "https://github.com/torvalds"
 * - www URLs: "https://www.github.com/torvalds/"
 * - Domain only: "github.com/torvalds"
 * - URLs with query strings or hashes: "https://github.com/torvalds?tab=repositories#readme"
 * @param {string} input
 * @returns {string} normalized lowercase username
 */
const extractUsername = (input) => {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.trim();

  // Strip query parameters and hash fragments
  cleaned = cleaned.split("?")[0].split("#")[0];

  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  // If it's a URL or contains github.com
  if (cleaned.includes("github.com")) {
    const parts = cleaned.split("/");
    cleaned = parts[parts.length - 1] || "";
  } else if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    const parts = cleaned.split("/");
    cleaned = parts[parts.length - 1] || "";
  }

  // Strip leading @
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned.trim().toLowerCase();
};

/**
 * Validate that a string conforms to official GitHub username rules:
 * - 1 to 39 characters
 * - Only alphanumeric and single hyphens
 * - Cannot start or end with a hyphen
 * - Cannot contain consecutive hyphens
 * @param {string} username
 * @returns {boolean}
 */
const isValidGitHubUsername = (username) => {
  if (!username || typeof username !== "string") return false;
  if (username.length < 1 || username.length > 39) return false;
  // Alphanumeric and single hyphens, not starting or ending with hyphen
  const validRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  return validRegex.test(username);
};

module.exports = {
  extractUsername,
  isValidGitHubUsername,
};
