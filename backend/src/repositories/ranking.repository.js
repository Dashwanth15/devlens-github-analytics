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

const getAllCampaigns = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    RankingCampaign.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RankingCampaign.countDocuments(),
  ]);

  // Attach candidate count to each campaign
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

// ── Candidates ─────────────────────────────────────────────────────────────────

const addOrUpdateCandidate = async (data) => {
  const filter  = { campaign_id: data.campaign_id, profile_id: data.profile_id };
  const update  = { $set: { ...data } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const doc = await CampaignCandidate.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

const getCandidatesByCampaign = async (campaignId) => {
  return CampaignCandidate.find({ campaign_id: campaignId })
    .sort({ rank_score: -1 })
    .lean();
};

const getCandidateByProfileAndCampaign = async (campaignId, profileId) => {
  return CampaignCandidate.findOne({ campaign_id: campaignId, profile_id: profileId }).lean();
};

module.exports = {
  createCampaign,
  getCampaignById,
  getAllCampaigns,
  updateCampaignStatus,
  addOrUpdateCandidate,
  getCandidatesByCampaign,
  getCandidateByProfileAndCampaign,
};
