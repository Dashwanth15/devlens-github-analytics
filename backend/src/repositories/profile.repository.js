/**
 * profile.repository.js - Database Query Layer (Repository Pattern)
 *
 * RESPONSIBILITY: All SQL queries live HERE and ONLY here.
 * No SQL in controllers, services, or routes.
 *
 * WHY REPOSITORY PATTERN?
 * If you switch from MySQL to PostgreSQL tomorrow,
 * you only change this one file — nothing else.
 */

const { pool } = require("../config/db");

/**
 * Find a profile by GitHub username
 * @param {string} username
 * @returns {Object|null} Profile row or null
 */
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    "SELECT * FROM profiles WHERE username = ? LIMIT 1",
    [username.toLowerCase()]
  );
  return rows[0] || null;
};

/**
 * Get all analyzed profiles - paginated, sorted by most recently analyzed
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Records per page
 * @returns {Object} { data, total, page, totalPages }
 */
const findAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT 
      id, username, name, avatar_url, profile_url, location,
      followers, following, public_repos, total_stars,
      most_used_language, popularity_score, account_age_days, analyzed_at
     FROM profiles 
     ORDER BY analyzed_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) as total FROM profiles"
  );

  return {
    data: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a full profile with its repositories
 * @param {string} username
 * @returns {Object|null} Profile with repos or null
 */
const findByUsernameWithRepos = async (username) => {
  const profile = await findByUsername(username);
  if (!profile) return null;

  const repos = await getRepositoriesByProfileId(profile.id);
  return { ...profile, repositories: repos };
};

/**
 * Insert a new profile into the database
 * @param {Object} profileData - Structured profile object
 * @returns {Object} The newly created profile
 */
const createProfile = async (profileData) => {
  const sql = `
    INSERT INTO profiles (
      username, name, bio, avatar_url, profile_url,
      company, location, email, blog,
      followers, following, public_repos, public_gists,
      total_stars, total_forks, most_used_language,
      popularity_score, account_age_days, github_created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    profileData.username.toLowerCase(),
    profileData.name,
    profileData.bio,
    profileData.avatar_url,
    profileData.profile_url,
    profileData.company,
    profileData.location,
    profileData.email,
    profileData.blog,
    profileData.followers,
    profileData.following,
    profileData.public_repos,
    profileData.public_gists,
    profileData.total_stars,
    profileData.total_forks,
    profileData.most_used_language,
    profileData.popularity_score,
    profileData.account_age_days,
    profileData.github_created_at,
  ];

  const [result] = await pool.query(sql, values);

  // Return the full newly created record
  return findByUsername(profileData.username);
};

/**
 * Bulk insert repositories for a profile
 * Uses multi-row INSERT for efficiency (one query, not N queries)
 * @param {number} profileId - FK reference to profiles.id
 * @param {Array} repos - Array of repo objects
 */
const createRepositories = async (profileId, repos) => {
  if (!repos || repos.length === 0) return;

  const sql = `
    INSERT INTO repositories 
      (profile_id, repo_name, description, language, stars, forks, watchers, is_fork, repo_url)
    VALUES ?
  `;

  // Build multi-row value array for bulk insert
  const values = repos.map((repo) => [
    profileId,
    repo.repo_name,
    repo.description,
    repo.language,
    repo.stars,
    repo.forks,
    repo.watchers,
    repo.is_fork,
    repo.repo_url,
  ]);

  await pool.query(sql, [values]);
};

/**
 * Get all repositories for a profile
 * @param {number} profileId
 * @returns {Array} Array of repo rows
 */
const getRepositoriesByProfileId = async (profileId) => {
  const [rows] = await pool.query(
    "SELECT * FROM repositories WHERE profile_id = ? ORDER BY stars DESC",
    [profileId]
  );
  return rows;
};

/**
 * Upsert repositories — insert any repos not already in DB (by repo_name + profile_id).
 * Uses INSERT IGNORE so existing rows are safely skipped.
 * Call this to sync new GitHub repos into an existing profile without wiping old data.
 * @param {number} profileId - FK reference to profiles.id
 * @param {Array} repos - Array of repo objects (same shape as createRepositories)
 */
const upsertRepositories = async (profileId, repos) => {
  if (!repos || repos.length === 0) return;

  const sql = `
    INSERT IGNORE INTO repositories 
      (profile_id, repo_name, description, language, stars, forks, watchers, is_fork, repo_url)
    VALUES ?
  `;

  const values = repos.map((repo) => [
    profileId,
    repo.repo_name,
    repo.description,
    repo.language,
    repo.stars,
    repo.forks,
    repo.watchers,
    repo.is_fork,
    repo.repo_url,
  ]);

  await pool.query(sql, [values]);
};

/**
 * Delete a profile by username (CASCADE deletes repos too)
 * @param {string} username
 * @returns {boolean} True if deleted, false if not found
 */
const deleteByUsername = async (username) => {
  const [result] = await pool.query(
    "DELETE FROM profiles WHERE username = ?",
    [username.toLowerCase()]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findByUsername,
  findAll,
  findByUsernameWithRepos,
  createProfile,
  createRepositories,
  upsertRepositories,
  getRepositoriesByProfileId,
  deleteByUsername,
};
