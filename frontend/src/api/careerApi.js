/**
 * careerApi.js - Career Growth Prediction API calls
 */
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
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
