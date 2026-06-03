/**
 * jobApi.js - Job Match Engine API calls
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000, // AI extraction can take time
});

export const matchJob = async (username, jobDescription, jobTitle = "") => {
  const { data } = await api.post("/jobs/match", { username, jobDescription, jobTitle });
  return data;
};

export const getJobMatches = async (username, page = 1, limit = 10) => {
  const { data } = await api.get(`/jobs/${username}?page=${page}&limit=${limit}`);
  return data;
};

export const getJobMatchById = async (username, id) => {
  const { data } = await api.get(`/jobs/${username}/${id}`);
  return data;
};

export const deleteJobMatch = async (id) => {
  const { data } = await api.delete(`/jobs/${id}`);
  return data;
};
