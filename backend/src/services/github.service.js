/**
 * github.service.js - GitHub API Communication Layer
 *
 * RESPONSIBILITIES:
 * - Direct HTTP communication with GitHub REST API
 * - Robust error handling (401 invalid token fallback, 404 handling, 403 rate limits)
 * - Safe repository name encoding
 * - Git Tree, Manifest, and Language inspection
 */

const axios = require("axios");
const https = require("https");
const dns = require("dns");
const env = require("../config/env");

// Configure public DNS resolvers to bypass local Windows DNS resolution timeouts
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Gracefully continue with default system DNS if setServers restricted
}

const customLookup = (hostname, options, callback) => {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "object" ? options : {};
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (opts.all) {
        return cb(null, addresses.map((a) => ({ address: a, family: 4 })));
      }
      return cb(null, addresses[0], 4);
    }
    dns.lookup(hostname, opts, cb);
  });
};

const httpsAgent = new https.Agent({ lookup: customLookup, keepAlive: true });

// Create an axios instance with GitHub API defaults
const createClient = (token) => {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevLens-Developer-Intelligence/1.0",
  };
  if (token && typeof token === "string" && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return axios.create({
    baseURL: env.github.baseUrl || "https://api.github.com",
    timeout: 12000,
    headers,
    httpsAgent,
  });
};

let primaryClient = createClient(env.github.token);
let fallbackClient = createClient(null);
let tokenDisabled = false;

// Safe request wrapper that falls back to unauthenticated if token is invalid (401)
const safeGet = async (url, config = {}) => {
  if (tokenDisabled) {
    return fallbackClient.get(url, config);
  }
  try {
    return await primaryClient.get(url, config);
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ GitHub token returned 401 Unauthorized. Switching to unauthenticated mode...");
      tokenDisabled = true;
      primaryClient = fallbackClient;
      return await fallbackClient.get(url, config);
    }
    throw err;
  }
};

/**
 * Fetch a GitHub user's public profile data
 * @param {string} username - GitHub username
 * @returns {Object} GitHub user object
 */
const fetchUserProfile = async (username) => {
  try {
    const response = await safeGet(`/users/${encodeURIComponent(username)}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again in a few minutes.");
    }
    throw new Error(`Failed to fetch GitHub profile: ${error.message}`);
  }
};

/**
 * Fetch all public repositories for a user
 * Handles pagination up to maxRepos (default 100-200)
 * Sorted by pushed date descending
 * @param {string} username - GitHub username
 * @returns {Array} Array of repository objects
 */
const fetchUserRepositories = async (username) => {
  try {
    const allRepos = [];
    let page = 1;
    const perPage = 100;
    const maxRepos = env.github.maxRepos || 200;

    while (allRepos.length < maxRepos) {
      const response = await safeGet(`/users/${encodeURIComponent(username)}/repos`, {
        params: {
          per_page: perPage,
          page: page,
          sort: "pushed",
          direction: "desc",
          type: "owner",
        },
      });

      const repos = response.data;
      if (!Array.isArray(repos) || repos.length === 0) break;

      allRepos.push(...repos);
      if (repos.length < perPage) break;
      page++;
    }

    // Standardize every repo with both name & repo_name, html_url & repo_url, topics, default_branch
    return allRepos.slice(0, maxRepos).map((repo) => {
      const canonicalName = repo.name || repo.repo_name || "";
      const canonicalUrl = repo.html_url || repo.repo_url || `https://github.com/${username}/${canonicalName}`;
      return {
        ...repo,
        id: repo.id || repo.repo_id,
        repo_id: repo.id || repo.repo_id,
        name: canonicalName,
        repo_name: canonicalName,
        full_name: repo.full_name || `${username}/${canonicalName}`,
        html_url: canonicalUrl,
        repo_url: canonicalUrl,
        default_branch: repo.default_branch || "main",
        topics: Array.isArray(repo.topics) ? repo.topics : [],
        is_fork: repo.fork ?? repo.is_fork ?? false,
      };
    });
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
  if (!repoName || typeof repoName !== "string" || repoName.trim() === "" || repoName === "undefined") {
    return {};
  }
  try {
    const cleanRepo = encodeURIComponent(repoName.trim());
    const cleanUser = encodeURIComponent(username.trim());
    const response = await safeGet(`/repos/${cleanUser}/${cleanRepo}/languages`);
    return response.data || {};
  } catch (err) {
    // 404 or empty repo gracefully returns empty map
    return {};
  }
};

/**
 * Normalize a GitHub languages byte map into structured array with percentages
 * @param {Object} byteMap - { JavaScript: 45000, HTML: 15000 }
 * @returns {Array} [{ name: "JavaScript", bytes: 45000, percentage: 75.0 }, ...]
 */
const normalizeLanguages = (byteMap = {}) => {
  const totalBytes = Object.values(byteMap).reduce((sum, b) => sum + (Number(b) || 0), 0);
  if (totalBytes === 0) return [];

  return Object.entries(byteMap).map(([name, bytes]) => ({
    name,
    bytes,
    percentage: Math.round(((bytes / totalBytes) * 100) * 10) / 10,
  })).sort((a, b) => b.bytes - a.bytes);
};

/**
 * Batch-fetch languages for multiple repos.
 * Limits to top N repos to stay within API rate limits.
 * Returns a map: { [repoName]: { JavaScript: 5000, Python: 2000, ... } }
 * @param {string} username
 * @param {Array} repos - Array of repo objects
 * @param {number} limit - Max repos to fetch (default 20)
 */
const fetchAllLanguagesForUser = async (username, repos = [], limit = 20) => {
  const validRepos = (repos || [])
    .filter((r) => r && (r.name || r.repo_name))
    .slice(0, limit);

  const results = {};
  const CONCURRENCY = 5;

  for (let i = 0; i < validRepos.length; i += CONCURRENCY) {
    const batch = validRepos.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (repo) => {
        const repoName = (repo.name || repo.repo_name).trim();
        const languages = await fetchRepoLanguages(username, repoName);
        return { name: repoName, languages };
      })
    );
    batchResults.forEach(({ name, languages }) => {
      results[name] = languages;
    });
  }

  return results;
};

/**
 * Fetch recursive file tree for a repository
 * Endpoint: GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
 * @param {string} username
 * @param {string} repoName
 * @param {string} branch
 * @returns {Array} Array of tree items { path, mode, type, sha, size }
 */
const fetchRepoTree = async (username, repoName, branch = "main") => {
  if (!repoName || repoName === "undefined") return [];
  const cleanRepo = encodeURIComponent(repoName.trim());
  const cleanUser = encodeURIComponent(username.trim());

  // Try provided branch, fallback to master if main fails
  const branchesToTry = [branch, "main", "master"].filter((v, i, a) => a.indexOf(v) === i);

  for (const b of branchesToTry) {
    try {
      const response = await safeGet(`/repos/${cleanUser}/${cleanRepo}/git/trees/${b}?recursive=1`);
      if (response.data?.tree && Array.isArray(response.data.tree)) {
        return response.data.tree;
      }
    } catch (err) {
      if (err.response?.status === 404) continue; // try next branch
      return [];
    }
  }
  return [];
};

/**
 * Fetch raw file content from repository (package.json, requirements.txt, etc.)
 * Tries raw.githubusercontent.com first (zero API quota consumption), falls back to API.
 * @param {string} username
 * @param {string} repoName
 * @param {string} filePath
 * @param {string} branch
 * @returns {string|null} File content string or null
 */
const fetchRawFileContent = async (username, repoName, filePath, branch = "main") => {
  if (!repoName || !filePath) return null;
  const cleanRepo = repoName.trim();
  const cleanUser = username.trim();
  const cleanPath = filePath.replace(/^\/+/, "");

  const branches = [branch, "main", "master"].filter((v, i, a) => a.indexOf(v) === i);

  // 1. Try raw.githubusercontent.com
  for (const b of branches) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${b}/${cleanPath}`;
      const response = await axios.get(rawUrl, {
        timeout: 7000,
        httpsAgent,
        headers: { "User-Agent": "DevLens-Developer-Intelligence/1.0" },
        responseType: "text",
        transformResponse: [(data) => data], // Don't auto-parse JSON to keep raw string
      });
      if (response.data && typeof response.data === "string" && response.status === 200) {
        return response.data;
      }
    } catch {
      // Continue to next branch or fallback
    }
  }

  // 2. Fallback to GitHub REST API
  try {
    const apiUrl = `/repos/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanRepo)}/contents/${cleanPath}`;
    const response = await safeGet(apiUrl);
    if (response.data?.content && response.data?.encoding === "base64") {
      return Buffer.from(response.data.content, "base64").toString("utf-8");
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Fetch repository README text content
 * @param {string} username
 * @param {string} repoName
 * @returns {string|null}
 */
const fetchRepoReadme = async (username, repoName) => {
  if (!repoName || repoName === "undefined") return null;
  try {
    const cleanRepo = encodeURIComponent(repoName.trim());
    const cleanUser = encodeURIComponent(username.trim());
    const response = await safeGet(`/repos/${cleanUser}/${cleanRepo}/readme`);
    if (response.data?.content && response.data?.encoding === "base64") {
      return Buffer.from(response.data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = {
  fetchUserProfile,
  fetchUserRepositories,
  fetchRepoLanguages,
  fetchAllLanguagesForUser,
  normalizeLanguages,
  fetchRepoTree,
  fetchRawFileContent,
  fetchRepoReadme,
};
