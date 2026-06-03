/**
 * rankingApi.js - Candidate Ranking API calls
 */
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Ranking pipeline can take 1-2min for many candidates
});

export const createCampaign = async (title, roleName, jobDescription) => {
  const { data } = await api.post("/ranking/campaigns", { title, roleName, jobDescription });
  return data;
};

export const getAllCampaigns = async (page = 1, limit = 20) => {
  const { data } = await api.get(`/ranking/campaigns?page=${page}&limit=${limit}`);
  return data;
};

export const getCampaign = async (id) => {
  const { data } = await api.get(`/ranking/campaigns/${id}`);
  return data;
};

export const deleteCampaign = async (id) => {
  const { data } = await api.delete(`/ranking/campaigns/${id}`);
  return data;
};

export const addCandidate = async (campaignId, username) => {
  const { data } = await api.post(`/ranking/campaigns/${campaignId}/candidates`, { username });
  return data;
};

export const removeCandidate = async (campaignId, username) => {
  const { data } = await api.delete(`/ranking/campaigns/${campaignId}/candidates/${username}`);
  return data;
};

export const rankCampaign = async (campaignId) => {
  const { data } = await api.post(`/ranking/campaigns/${campaignId}/rank`);
  return data;
};
