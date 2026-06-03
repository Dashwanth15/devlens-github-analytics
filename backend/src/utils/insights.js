/**
 * insights.js - Pure Utility Functions for Computing GitHub Insights
 *
 * WHY PURE FUNCTIONS?
 * These functions take input and return output with no side effects.
 * No DB calls, no API calls — just computation.
 * Easy to unit test, easy to reason about.
 */

/**
 * Calculate account age in days from GitHub account creation date
 * @param {string} createdAt - ISO 8601 date string from GitHub API
 * @returns {number} Age in days
 */
const calculateAccountAgeDays = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculate total stars across all repositories
 * @param {Array} repos - Array of GitHub repo objects
 * @returns {number} Total star count
 */
const calculateTotalStars = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
};

/**
 * Calculate total forks across all repositories
 * @param {Array} repos - Array of GitHub repo objects
 * @returns {number} Total fork count
 */
const calculateTotalForks = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
};

/**
 * Find the most used programming language across all repositories
 * Excludes forked repos (they don't represent the user's work)
 * Excludes null/undefined languages
 *
 * @param {Array} repos - Array of GitHub repo objects
 * @returns {string|null} Most frequently used language, or null
 */
const findMostUsedLanguage = (repos) => {
  // Only count original repos, not forks
  const ownRepos = repos.filter((repo) => !repo.fork && repo.language);

  if (ownRepos.length === 0) return null;

  // Count frequency of each language
  const languageCount = ownRepos.reduce((acc, repo) => {
    const lang = repo.language;
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  // Return the language with the highest count
  return Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0][0];
};

/**
 * Calculate a composite popularity score
 *
 * FORMULA:
 * score = (followers × 2) + (totalStars × 1.5) + (totalForks × 1) + (publicRepos × 0.5)
 *
 * REASONING:
 * - Followers weighted highest — real humans chose to follow
 * - Stars are strong engagement signal
 * - Forks indicate code reuse
 * - Public repos weighted least — quantity ≠ quality
 *
 * @param {number} followers
 * @param {number} totalStars
 * @param {number} totalForks
 * @param {number} publicRepos
 * @returns {number} Popularity score (2 decimal places)
 */
const calculatePopularityScore = (followers, totalStars, totalForks, publicRepos) => {
  const score =
    followers * 2 +
    totalStars * 1.5 +
    totalForks * 1 +
    publicRepos * 0.5;
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Get top N repositories sorted by stars
 * @param {Array} repos - Array of GitHub repo objects
 * @param {number} limit - Max number of repos to return (default: 5)
 * @returns {Array} Top repos sorted by stars descending
 */
const getTopRepositories = (repos, limit = 5) => {
  return repos
    .filter((repo) => !repo.fork) // Only original repos
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, limit)
    .map((repo) => ({
      repo_name: repo.name,
      description: repo.description || null,
      language: repo.language || null,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
      is_fork: repo.fork || false,
      repo_url: repo.html_url,
    }));
};

/**
 * Get language distribution across all repos (for charting)
 * @param {Array} repos - Array of GitHub repo objects
 * @returns {Object} { JavaScript: 10, Python: 5, ... }
 */
const getLanguageDistribution = (repos) => {
  return repos
    .filter((repo) => !repo.fork && repo.language)
    .reduce((acc, repo) => {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
      return acc;
    }, {});
};

module.exports = {
  calculateAccountAgeDays,
  calculateTotalStars,
  calculateTotalForks,
  findMostUsedLanguage,
  calculatePopularityScore,
  getTopRepositories,
  getLanguageDistribution,
};
