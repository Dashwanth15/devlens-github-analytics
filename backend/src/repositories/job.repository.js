/**
 * job.repository.js - MongoDB Query Layer for Job Analyses
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const JobAnalysis = require("../models/JobAnalysis");

const createJobAnalysis = async (data) => {
  // Check if an analysis with this source_hash already exists for this profile
  if (data.source_hash) {
    const existing = await JobAnalysis.findOne({
      profile_id: data.profile_id,
      source_hash: data.source_hash,
    }).lean();
    if (existing) return existing;
  }

  const doc = await JobAnalysis.create({
    profile_id:            data.profile_id,
    job_title:             data.job_title,
    job_description:       data.job_description,
    required_skills:       data.required_skills || [],
    nice_to_have_skills:   data.nice_to_have_skills || [],
    experience_level:      data.experience_level,
    match_score:           data.match_score,
    skill_match_breakdown: data.skill_match_breakdown || {},
    strengths:             data.strengths || [],
    gaps:                  data.gaps || [],
    hiring_readiness:      data.hiring_readiness,
    recommendations:       data.recommendations || [],
    source_hash:           data.source_hash,
  });

  return doc.toObject();
};

const findById = async (id) => {
  return JobAnalysis.findById(id).lean();
};

const findByProfileId = async (profileId) => {
  return JobAnalysis.find({ profile_id: profileId })
    .sort({ createdAt: -1 })
    .lean();
};

const findByProfileIdAndHash = async (profileId, hash) => {
  return JobAnalysis.findOne({ profile_id: profileId, source_hash: hash }).lean();
};

module.exports = {
  createJobAnalysis,
  findById,
  findByProfileId,
  findByProfileIdAndHash,
};
