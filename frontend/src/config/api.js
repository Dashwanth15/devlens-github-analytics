/**
 * api.js - Centralized API Configuration
 *
 * Single source of truth for the backend API base URL.
 *
 * VITE_API_URL should always include the /api suffix:
 *   - Local:      http://localhost:5000/api
 *   - Production: https://devlens-github-analytics-api.onrender.com/api
 *
 * The normalization below also accepts URLs without the suffix as a
 * safety fallback (auto-appends /api if missing).
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Normalize: strip trailing slash, then ensure the URL ends with /api
export const API_BASE_URL = rawBaseUrl.endsWith("/api") || rawBaseUrl.endsWith("/api/")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;
