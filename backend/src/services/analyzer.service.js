/**
 * analyzer.service.js - Core Business Logic Layer
 *
 * RESPONSIBILITY:
 * Orchestrates the full analysis pipeline:
 *   1. Fetch data from GitHub
 *   2. Compute insights
 *   3. Save to database
 *   4. Return structured result
 *
 * This is the "brain" of the application.
 * Controllers call this. This calls GitHub service + DB repository.
 */

const githubService = require("./github.service");
const profileRepository = require("../repositories/profile.repository");
const {
  calculateAccountAgeDays,
  calculateTotalStars,
  calculateTotalForks,
  findMostUsedLanguage,
  calculatePopularityScore,
  getTopRepositories,
  getLanguageDistribution,
} = require("../utils/insights");

/**
 * Full analysis pipeline for a GitHub username.
 * Throws if user already exists (duplicate prevention).
 *
 * @param {string} username - GitHub username
 * @returns {Object} Complete profile with insights
 */
const analyzeProfile = async (username) => {
  // ── STEP 1: Check for existing profile (prevent duplicates) ──────────────
  const existingProfile = await profileRepository.findByUsername(username);
  if (existingProfile) {
    // Return existing data instead of re-fetching
    const repos = await profileRepository.getRepositoriesByProfileId(existingProfile.id);
    return {
      alreadyExists: true,
      profile: existingProfile,
      repositories: repos,
    };
  }

  // ── STEP 2: Fetch live data from GitHub API ──────────────────────────────
  const [githubUser, githubRepos] = await Promise.all([
    githubService.fetchUserProfile(username),
    githubService.fetchUserRepositories(username),
  ]);

  // ── STEP 3: Compute all insights ─────────────────────────────────────────
  const totalStars = calculateTotalStars(githubRepos);
  const totalForks = calculateTotalForks(githubRepos);
  const mostUsedLanguage = findMostUsedLanguage(githubRepos);
  const accountAgeDays = calculateAccountAgeDays(githubUser.created_at);
  const popularityScore = calculatePopularityScore(
    githubUser.followers,
    totalStars,
    totalForks,
    githubUser.public_repos
  );
  const topRepos = getTopRepositories(githubRepos, 100); // Save ALL repos — not just top 10
  const languageDistribution = getLanguageDistribution(githubRepos);

  // ── STEP 4: Structure the profile data for DB insertion ──────────────────
  const profileData = {
    username: githubUser.login,
    name: githubUser.name || null,
    bio: githubUser.bio || null,
    avatar_url: githubUser.avatar_url || null,
    profile_url: githubUser.html_url || null,
    company: githubUser.company || null,
    location: githubUser.location || null,
    email: githubUser.email || null,
    blog: githubUser.blog || null,
    followers: githubUser.followers || 0,
    following: githubUser.following || 0,
    public_repos: githubUser.public_repos || 0,
    public_gists: githubUser.public_gists || 0,
    total_stars: totalStars,
    total_forks: totalForks,
    most_used_language: mostUsedLanguage,
    popularity_score: popularityScore,
    account_age_days: accountAgeDays,
    github_created_at: new Date(githubUser.created_at),
  };

  // ── STEP 5: Save to database ──────────────────────────────────────────────
  const savedProfile = await profileRepository.createProfile(profileData);

  // Save top repositories (linked by profile_id)
  if (topRepos.length > 0) {
    await profileRepository.createRepositories(savedProfile.id, topRepos);
  }

  // ── STEP 6: Return full result ────────────────────────────────────────────
  return {
    alreadyExists: false,
    profile: {
      ...savedProfile,
      language_distribution: languageDistribution,
    },
    repositories: topRepos,
  };
};

/**
 * Re-analyze an existing profile (force refresh from GitHub)
 * Deletes old data and re-runs the full pipeline
 *
 * @param {string} username - GitHub username
 * @returns {Object} Fresh profile with insights
 */
const refreshProfile = async (username) => {
  // Delete old data first (CASCADE will also delete repos)
  await profileRepository.deleteByUsername(username);
  // Re-analyze fresh
  return analyzeProfile(username);
};

module.exports = { analyzeProfile, refreshProfile };
