/**
 * analyzer.service.js - Core Business Logic Layer
 * Strictly enforces rolling "Latest 20 Developers" queue.
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

const analyzeProfile = async (username) => {
  if (!username) {
    throw new Error("Username is required.");
  }
  const cleanUsername = username.toLowerCase().trim();

  // Check if profile already exists in DB
  const existingProfile = await profileRepository.findByUsername(cleanUsername);

  // Fetch fresh profile and repositories from GitHub
  // If GitHub API fails (e.g. invalid user / 404), this throws and NO profile is saved or updated
  const [githubUser, githubRepos] = await Promise.all([
    githubService.fetchUserProfile(cleanUsername),
    githubService.fetchUserRepositories(cleanUsername),
  ]);

  // Compute insights
  const totalStars       = calculateTotalStars(githubRepos);
  const totalForks       = calculateTotalForks(githubRepos);
  const mostUsedLanguage = findMostUsedLanguage(githubRepos);
  const accountAgeDays   = calculateAccountAgeDays(githubUser.created_at);
  const popularityScore  = calculatePopularityScore(
    githubUser.followers, totalStars, totalForks, githubUser.public_repos
  );
  const topRepos             = getTopRepositories(githubRepos, 100);
  const languageDistribution = getLanguageDistribution(githubRepos);

  // Map repos to our schema shape
  const mappedRepos = topRepos.map((r) => {
    const canonicalName = r.name || r.repo_name || "";
    const canonicalUrl = r.html_url || r.repo_url || null;
    return {
      id:           r.id || r.repo_id || null,
      repo_id:      r.id || r.repo_id || null,
      name:         canonicalName,
      repo_name:    canonicalName,
      full_name:    r.full_name || canonicalName,
      description:  r.description || null,
      html_url:     canonicalUrl,
      repo_url:     canonicalUrl,
      language:     r.language || null,
      languages:    r.languages || [],
      stars:        r.stars ?? r.stargazers_count ?? 0,
      forks:        r.forks ?? r.forks_count ?? 0,
      watchers:     r.watchers ?? r.watchers_count ?? 0,
      open_issues:  r.open_issues ?? r.open_issues_count ?? 0,
      size:         r.size || 0,
      is_fork:      r.is_fork ?? r.fork ?? false,
      topics:       Array.isArray(r.topics) ? r.topics : [],
      default_branch: r.default_branch || "main",
      created_at:   r.created_at ? new Date(r.created_at) : null,
      pushed_at:    r.pushed_at  ? new Date(r.pushed_at)  : null,
    };
  });

  const now = new Date();

  // Upsert profile:
  // - If exists: updates existing record, refreshes stats, updates lastAnalyzedAt to NOW (moves to top of queue)
  // - If new: inserts record and prunes oldest profile if queue exceeds 20
  const savedProfile = await profileRepository.upsertProfile({
    username:           githubUser.login.toLowerCase(),
    usernameNormalized: githubUser.login.toLowerCase(),
    name:               githubUser.name        || null,
    bio:                githubUser.bio         || null,
    avatar_url:         githubUser.avatar_url  || null,
    profile_url:        githubUser.html_url    || null,
    company:            githubUser.company     || null,
    location:           githubUser.location    || null,
    email:              githubUser.email       || null,
    blog:               githubUser.blog        || null,
    followers:          githubUser.followers   || 0,
    following:          githubUser.following   || 0,
    public_repos:       githubUser.public_repos || 0,
    total_stars:        totalStars,
    total_forks:        totalForks,
    most_used_language: mostUsedLanguage,
    popularity_score:   popularityScore,
    account_age_days:   accountAgeDays,
    languages_used:     languageDistribution,
    repositories:       mappedRepos,
    lastAnalyzedAt:     now,
    analyzed_at:        now,
  });

  return {
    alreadyExists: !!existingProfile,
    profile: {
      ...savedProfile,
      language_distribution: languageDistribution,
    },
    repositories: mappedRepos,
  };
};

const refreshProfile = async (username) => {
  return analyzeProfile(username);
};

module.exports = { analyzeProfile, refreshProfile };
