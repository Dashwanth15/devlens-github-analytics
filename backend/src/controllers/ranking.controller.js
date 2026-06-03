/**
 * ranking.controller.js - Candidate Ranking System HTTP Handlers
 */

const rankingService = require("../services/ranking.service");
const rankingRepository = require("../repositories/ranking.repository");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/ranking/campaigns
const createCampaign = asyncHandler(async (req, res) => {
  const { title, roleName, jobDescription } = req.body;
  if (!title || !jobDescription) {
    return res.status(400).json({
      success: false,
      message: "Campaign title and job description are required.",
    });
  }
  if (jobDescription.trim().length < 50) {
    return res.status(400).json({
      success: false,
      message: "Job description must be at least 50 characters.",
    });
  }
  const campaign = await rankingService.createCampaign(
    title.trim(),
    roleName?.trim() || null,
    jobDescription.trim()
  );
  return res.status(201).json({
    success: true,
    message: `Campaign '${title}' created.`,
    data: campaign,
  });
});

// GET /api/ranking/campaigns
const getAllCampaigns = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const result = await rankingRepository.getAllCampaigns(page, limit);
  return res.status(200).json({
    success: true,
    data: result.data,
    pagination: { total: result.total, page: result.page, totalPages: result.totalPages },
  });
});

// GET /api/ranking/campaigns/:id
const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await rankingRepository.getCampaignWithCandidates(req.params.id);
  if (!campaign) {
    return res.status(404).json({ success: false, message: "Campaign not found." });
  }
  return res.status(200).json({ success: true, data: campaign });
});

// DELETE /api/ranking/campaigns/:id
const deleteCampaign = asyncHandler(async (req, res) => {
  const deleted = await rankingRepository.deleteCampaign(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Campaign not found." });
  }
  return res.status(200).json({ success: true, message: "Campaign deleted." });
});

// POST /api/ranking/campaigns/:id/candidates
const addCandidate = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: "GitHub username is required." });
  }
  const candidate = await rankingService.addCandidate(req.params.id, username.trim().toLowerCase());
  return res.status(201).json({
    success: true,
    message: `Candidate '${username}' added to campaign.`,
    data: candidate,
  });
});

// DELETE /api/ranking/campaigns/:id/candidates/:username
const removeCandidate = asyncHandler(async (req, res) => {
  const { id, username } = req.params;
  const deleted = await rankingRepository.removeCandidateByUsername(id, username);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Candidate not found in campaign." });
  }
  return res.status(200).json({ success: true, message: `Candidate '${username}' removed.` });
});

// POST /api/ranking/campaigns/:id/rank  — trigger full ranking pipeline
const rankCampaign = asyncHandler(async (req, res) => {
  const result = await rankingService.rankCampaign(req.params.id);
  return res.status(200).json({
    success: true,
    message: "Ranking complete.",
    data: result,
  });
});

module.exports = { createCampaign, getAllCampaigns, getCampaign, deleteCampaign, addCandidate, removeCandidate, rankCampaign };
