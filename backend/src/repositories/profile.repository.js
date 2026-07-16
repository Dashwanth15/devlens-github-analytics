/**
 * profile.repository.js - MongoDB Query Layer (Repository Pattern)
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const Profile = require("../models/Profile");

const findByUsername = async (username) => {
  return Profile.findOne({ username: username.toLowerCase() }).lean();
};

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
    ).sort({ analyzed_at: -1 }).skip(skip).limit(limit).lean(),
    Profile.countDocuments(),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const findByUsernameWithRepos = async (username) => {
  return Profile.findOne({ username: username.toLowerCase() }).lean();
};

const upsertProfile = async (profileData) => {
  const filter  = { username: profileData.username.toLowerCase() };
  const update  = { $set: { ...profileData, analyzed_at: new Date() } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return Profile.findOneAndUpdate(filter, update, options).lean();
};

/** Used by resume.service.js to sync repos after analysis */
const upsertRepositories = async (profileId, repos) => {
  const mappedRepos = repos.map((r) => ({
    repo_id:     r.id || r.repo_id,
    name:        r.name,
    full_name:   r.full_name,
    description: r.description,
    html_url:    r.html_url,
    language:    r.language,
    stars:       r.stargazers_count || r.stars || 0,
    forks:       r.forks_count      || r.forks || 0,
    watchers:    r.watchers_count   || r.watchers || 0,
    open_issues: r.open_issues_count || r.open_issues || 0,
    size:        r.size || 0,
    is_fork:     r.fork || r.is_fork || false,
    topics:      r.topics || [],
    created_at:  r.created_at ? new Date(r.created_at) : null,
    pushed_at:   r.pushed_at  ? new Date(r.pushed_at)  : null,
  }));
  return Profile.findByIdAndUpdate(
    profileId,
    { $set: { repositories: mappedRepos } },
    { new: true }
  ).lean();
};

/** Get repos from an embedded profile - supports both _id (MongoDB) and id */
const getRepositoriesByProfileId = async (profileId) => {
  const profile = await Profile.findById(profileId, { repositories: 1 }).lean();
  return profile ? (profile.repositories || []) : [];
};

const getRepositoriesByUsername = async (username) => {
  const profile = await Profile.findOne(
    { username: username.toLowerCase() },
    { repositories: 1 }
  ).lean();
  return profile ? (profile.repositories || []) : [];
};

const deleteByUsername = async (username) => {
  const result = await Profile.deleteOne({ username: username.toLowerCase() });
  return result.deletedCount > 0;
};

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
  ).limit(limit).lean();
};

const getTopProfiles = async (limit = 20) => {
  return Profile.find(
    {},
    {
      username: 1, name: 1, avatar_url: 1, location: 1,
      followers: 1, public_repos: 1, most_used_language: 1,
      overall_score: 1, popularity_score: 1, analyzed_at: 1,
    }
  ).sort({ overall_score: -1 }).limit(limit).lean();
};

module.exports = {
  findByUsername,
  findAll,
  findByUsernameWithRepos,
  upsertProfile,
  upsertRepositories,
  getRepositoriesByProfileId,
  getRepositoriesByUsername,
  deleteByUsername,
  searchProfiles,
  getTopProfiles,
};
