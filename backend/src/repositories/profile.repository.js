/**
 * profile.repository.js - MongoDB Query Layer (Repository Pattern)
 *
 * RESPONSIBILITY: All database operations live HERE and ONLY here.
 * No Mongoose queries in controllers, services, or routes.
 *
 * Migrated from MySQL (mysql2) → MongoDB (Mongoose)
 */

const Profile = require("../models/Profile");

/**
 * Find a profile by GitHub username
 */
const findByUsername = async (username) => {
  return Profile.findOne({ username: username.toLowerCase() }).lean();
};

/**
 * Get all profiles - paginated, sorted by most recently analyzed
 */
const findAll = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Profile.find(
      {},
      {
        username: 1, name: 1, avatar_url: 1, profile_url: 1, location: 1,
        followers: 1, following: 1, public_repos: 1, total_stars: 1,
        most_used_language: 1, popularity_score: 1, account_age_days: 1, analyzed_at: 1,
      }
    )
      .sort({ analyzed_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Profile.countDocuments(),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a full profile with its embedded repositories
 */
const findByUsernameWithRepos = async (username) => {
  return Profile.findOne({ username: username.toLowerCase() }).lean();
};

/**
 * Upsert (insert or update) a profile and its repositories
 */
const upsertProfile = async (profileData) => {
  const filter = { username: profileData.username.toLowerCase() };
  const update = {
    $set: {
      ...profileData,
      analyzed_at: new Date(),
    },
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  return Profile.findOneAndUpdate(filter, update, options).lean();
};

/**
 * Search profiles by username or name (case-insensitive)
 */
const searchProfiles = async (query, limit = 10) => {
  return Profile.find(
    {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name:     { $regex: query, $options: "i" } },
      ],
    },
    {
      username: 1, name: 1, avatar_url: 1, location: 1,
      followers: 1, public_repos: 1, most_used_language: 1, overall_score: 1,
    }
  )
    .limit(limit)
    .lean();
};

/**
 * Get top profiles by overall score (for discover/leaderboard)
 */
const getTopProfiles = async (limit = 20) => {
  return Profile.find(
    {},
    {
      username: 1, name: 1, avatar_url: 1, location: 1,
      followers: 1, public_repos: 1, most_used_language: 1,
      overall_score: 1, popularity_score: 1, analyzed_at: 1,
    }
  )
    .sort({ overall_score: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get repositories for a given profile username
 */
const getRepositoriesByUsername = async (username) => {
  const profile = await Profile.findOne(
    { username: username.toLowerCase() },
    { repositories: 1 }
  ).lean();
  return profile ? profile.repositories : [];
};

module.exports = {
  findByUsername,
  findAll,
  findByUsernameWithRepos,
  upsertProfile,
  searchProfiles,
  getTopProfiles,
  getRepositoriesByUsername,
};
