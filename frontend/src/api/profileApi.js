/**
 * profileApi.js - All API calls to the backend
 * Single source of truth for HTTP communication
 */

import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Analyze a GitHub profile
export const analyzeProfile = async (username) => {
  const { data } = await api.post("/profiles/analyze", { username });
  return data;
};

// Force refresh an existing profile
export const refreshProfile = async (username) => {
  const { data } = await api.post("/profiles/refresh", { username });
  return data;
};

// Get all analyzed profiles (paginated)
export const getAllProfiles = async (page = 1, limit = 10) => {
  const { data } = await api.get(`/profiles?page=${page}&limit=${limit}`);
  return data;
};

// Get a single profile with repositories
export const getProfileByUsername = async (username) => {
  const { data } = await api.get(`/profiles/${username}`);
  return data;
};

// Delete a profile
export const deleteProfile = async (username) => {
  const { data } = await api.delete(`/profiles/${username}`);
  return data;
};

export default api;
