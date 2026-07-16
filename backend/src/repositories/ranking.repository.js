/**
 * ranking.repository.js - MongoDB Query Layer for Ranking Campaigns & Candidates
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const { RankingCampaign, CampaignCandidate } = require("../models/RankingCampaign");

// ── Campaigns ──────────────────────────────────────────────────────────────────

const createCampaign = async (data) => {
  const doc = await RankingCampaign.create({
    title:           data.title,
    role_name:       data.role_name,
    job_description: data.job_description,
    required_skills: data.required_skills || [],
    status:          data.status || "active",
  });
  return doc.toObject();
};

const getCampaignById = async (id) => {
  return RankingCampaign.findById(id).lean();
};

const getCampaignWithCandidates = async (id) => {
  const campaign = await RankingCampaign.findById(id).lean();
  if (!campaign) return null;
  const candidates = await CampaignCandidate.find({ campaign_id: id })
    .sort({ rank_score: -1 })
    .lean();
  return { ...campaign, candidates };
};

const getAllCampaigns = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [campaigns, total] = await Promise.all([
    RankingCampaign.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RankingCampaign.countDocuments(),
  ]);

  // Attach candidate counts
  const campaignIds = campaigns.map((c) => c._id);
  const counts = await CampaignCandidate.aggregate([
    { $match: { campaign_id: { $in: campaignIds } } },
    { $group: { _id: "$campaign_id", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const data = campaigns.map((c) => ({
    ...c,
    candidate_count: countMap[c._id.toString()] || 0,
  }));

  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const updateCampaignStatus = async (id, status) => {
  return RankingCampaign.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
};

const deleteCampaign = async (id) => {
  const result = await RankingCampaign.findByIdAndDelete(id);
  if (result) await CampaignCandidate.deleteMany({ campaign_id: id });
  return !!result;
};

// ── Candidates ─────────────────────────────────────────────────────────────────

/** Used by ranking.service.js addCandidate */
const addCandidate = async (campaignId, profileId, username) => {
  const filter  = { campaign_id: campaignId, profile_id: profileId };
  const update  = { $set: { campaign_id: campaignId, profile_id: profileId, username } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await CampaignCandidate.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

const addOrUpdateCandidate = async (data) => {
  const filter  = { campaign_id: data.campaign_id, profile_id: data.profile_id };
  const update  = { $set: { ...data } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await CampaignCandidate.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

/** Used by ranking.service.js rankCampaign */
const getCandidates = async (campaignId) => {
  return CampaignCandidate.find({ campaign_id: campaignId }).lean();
};

const getCandidatesByCampaign = async (campaignId) => {
  return CampaignCandidate.find({ campaign_id: campaignId })
    .sort({ rank_score: -1 })
    .lean();
};

const getCandidateByProfileAndCampaign = async (campaignId, profileId) => {
  return CampaignCandidate.findOne({ campaign_id: campaignId, profile_id: profileId }).lean();
};

const updateCandidateStatus = async (candidateId, status) => {
  return CampaignCandidate.findByIdAndUpdate(
    candidateId,
    { $set: { analysis_status: status } },
    { new: true }
  ).lean();
};

const updateCandidateScores = async (candidateId, scores) => {
  return CampaignCandidate.findByIdAndUpdate(
    candidateId,
    { $set: scores },
    { new: true }
  ).lean();
};

const updateCandidateRank = async (candidateId, rank) => {
  return CampaignCandidate.findByIdAndUpdate(
    candidateId,
    { $set: { rank } },
    { new: true }
  ).lean();
};

const removeCandidateByUsername = async (campaignId, username) => {
  const result = await CampaignCandidate.deleteOne({
    campaign_id: campaignId,
    username: username.toLowerCase(),
  });
  return result.deletedCount > 0;
};

module.exports = {
  createCampaign,
  getCampaignById,
  getCampaignWithCandidates,
  getAllCampaigns,
  updateCampaignStatus,
  deleteCampaign,
  addCandidate,
  addOrUpdateCandidate,
  getCandidates,
  getCandidatesByCampaign,
  getCandidateByProfileAndCampaign,
  updateCandidateStatus,
  updateCandidateScores,
  updateCandidateRank,
  removeCandidateByUsername,
};
