/**
 * careerApi.js - Career Growth Prediction API calls
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

export const getCareerPrediction = async (username) => {
  const { data } = await api.get(`/career/${username}`);
  return data;
};

export const refreshCareerPrediction = async (username) => {
  const { data } = await api.post(`/career/${username}/refresh`);
  return data;
};
