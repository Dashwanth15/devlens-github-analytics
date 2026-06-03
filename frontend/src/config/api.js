/**
 * api.js - Centralized API Configuration
 * 
 * Auto-detects and normalizes VITE_API_URL so it always has the correct path.
 * If VITE_API_URL has a trailing /api prefix, it is used as is.
 * Otherwise, /api is cleanly appended.
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Normalize trailing slashes and ensure it ends with "/api"
export const API_BASE_URL = rawBaseUrl.endsWith("/api") || rawBaseUrl.endsWith("/api/")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;
