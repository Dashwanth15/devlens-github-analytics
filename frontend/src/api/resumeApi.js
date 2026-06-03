/**
 * resumeApi.js - Resume Analysis API calls
 */
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120s — PDF parsing + AI can take time
});

// Upload a PDF resume file
// NOTE: Do NOT set Content-Type manually — axios auto-sets multipart/form-data
// with the correct boundary string when it detects FormData. Setting it manually
// strips the boundary and causes multer to fail silently on the server.
export const analyzeResumeFile = async (username, file) => {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("file", file);
  const { data } = await api.post("/resume/analyze", formData);
  return data;
};

// Analyze pasted resume text
export const analyzeResumeText = async (username, text) => {
  const { data } = await api.post("/resume/analyze-text", { username, text });
  return data;
};

// Get stored resume analysis
export const getResumeAnalysis = async (username) => {
  const { data } = await api.get(`/resume/${username}`);
  return data;
};

// Delete resume analysis
export const deleteResumeAnalysis = async (username) => {
  const { data } = await api.delete(`/resume/${username}`);
  return data;
};
