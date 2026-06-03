/**
 * github.service.js - GitHub API Communication Layer
 *
 * RESPONSIBILITY: Only one job — talk to the GitHub API.
 * All other services call this. No DB logic here.
 *
 * WHY AXIOS?
 * - Cleaner than node-fetch for setting default headers
 * - Built-in timeout support
 * - Auto JSON parsing
 * - Better error objects
 *
 * RATE LIMITING:
 * Unauthenticated: 60 req/hour
 * With token:    5000 req/hour
 * We always use a token.
 */

const axios = require("axios");
const env = require("../config/env");

// Create an axios instance with GitHub API defaults
const githubClient = axios.create({
  baseURL: env.github.baseUrl,
  timeout: 10000, // 10 second timeout
  headers: {
    Authorization: `Bearer ${env.github.token}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

/**
 * Fetch a GitHub user's public profile data
 * @param {string} username - GitHub username
 * @returns {Object} GitHub user object
 */
const fetchUserProfile = async (username) => {
  try {
    const response = await githubClient.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    }
    if (error.response?.status === 401) {
      throw new Error("Invalid GitHub token. Check your GITHUB_TOKEN env variable.");
    }
    throw new Error(`Failed to fetch GitHub profile: ${error.message}`);
  }
};

/**
 * Fetch all public repositories for a user
 * Handles pagination to get up to maxRepos repos
 * Sorted by stars (most popular first)
 * @param {string} username - GitHub username
 * @returns {Array} Array of repository objects
 */
const fetchUserRepositories = async (username) => {
  try {
    const allRepos = [];
    let page = 1;
    const perPage = 100; // GitHub max per page

    // Paginate until we have all repos or hit our limit
    while (allRepos.length < env.github.maxRepos) {
      const response = await githubClient.get(`/users/${username}/repos`, {
        params: {
          per_page: perPage,
          page: page,
          sort: "pushed", // Most recently active first
          direction: "desc",
          type: "owner", // Only repos they own (not member repos)
        },
      });

      const repos = response.data;
      if (repos.length === 0) break; // No more pages

      allRepos.push(...repos);

      // If GitHub returned less than perPage, we've hit the last page
      if (repos.length < perPage) break;

      page++;
    }

    return allRepos.slice(0, env.github.maxRepos);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Repositories for '${username}' not found`);
    }
    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
};

/**
 * Fetch all programming languages used in a single repo.
 * Returns byte counts per language: { JavaScript: 12400, HTML: 3200, CSS: 1100 }
 * @param {string} username
 * @param {string} repoName
 * @returns {Object} language → byte count map
 */
const fetchRepoLanguages = async (username, repoName) => {
  try {
    const response = await githubClient.get(`/repos/${username}/${repoName}/languages`);
    return response.data || {};
  } catch {
    return {}; // Gracefully skip inaccessible repos
  }
};

/**
 * Batch-fetch languages for multiple repos.
 * Limits to top N repos to stay within API rate limits.
 * Returns a map: { repoName: { JavaScript: 5000, Python: 2000, ... } }
 * @param {string} username
 * @param {Array} repos - Array of repo objects (must have repo_name)
 * @param {number} limit - Max repos to fetch (default 20)
 */
const fetchAllLanguagesForUser = async (username, repos, limit = 20) => {
  const topRepos = repos.slice(0, limit);
  const results = {};

  // Fetch in parallel with concurrency cap of 5 to avoid rate limiting
  const CONCURRENCY = 5;
  for (let i = 0; i < topRepos.length; i += CONCURRENCY) {
    const batch = topRepos.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (repo) => ({
        name: repo.repo_name || repo.name,
        languages: await fetchRepoLanguages(username, repo.repo_name || repo.name),
      }))
    );
    batchResults.forEach(({ name, languages }) => {
      results[name] = languages;
    });
  }

  return results;
};

module.exports = { fetchUserProfile, fetchUserRepositories, fetchRepoLanguages, fetchAllLanguagesForUser };
