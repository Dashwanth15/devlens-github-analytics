/**
 * analyzer.service.js - Core Business Logic Layer
 * Migrated from MySQL → MongoDB (Mongoose)
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
  // Check for existing profile
  const existingProfile = await profileRepository.findByUsername(username);
  if (existingProfile) {
    return {
      alreadyExists: true,
      profile: existingProfile,
      repositories: existingProfile.repositories || [],
    };
  }

  // Fetch from GitHub
  const [githubUser, githubRepos] = await Promise.all([
    githubService.fetchUserProfile(username),
    githubService.fetchUserRepositories(username),
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
  const mappedRepos = topRepos.map((r) => ({
    repo_id:      r.id,
    name:         r.name,
    full_name:    r.full_name,
    description:  r.description,
    html_url:     r.html_url,
    language:     r.language,
    stars:        r.stargazers_count || r.stars || 0,
    forks:        r.forks_count      || r.forks || 0,
    watchers:     r.watchers_count   || r.watchers || 0,
    open_issues:  r.open_issues_count || r.open_issues || 0,
    size:         r.size || 0,
    is_fork:      r.fork || r.is_fork || false,
    topics:       r.topics || [],
    created_at:   r.created_at ? new Date(r.created_at) : null,
    pushed_at:    r.pushed_at  ? new Date(r.pushed_at)  : null,
  }));

  // Upsert profile (with embedded repositories)
  const savedProfile = await profileRepository.upsertProfile({
    username:           githubUser.login.toLowerCase(),
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
    analyzed_at:        new Date(),
  });

  return {
    alreadyExists: false,
    profile: {
      ...savedProfile,
      language_distribution: languageDistribution,
    },
    repositories: mappedRepos,
  };
};

const refreshProfile = async (username) => {
  // Delete existing then re-analyze
  await profileRepository.deleteByUsername(username);
  return analyzeProfile(username);
};

module.exports = { analyzeProfile, refreshProfile };
