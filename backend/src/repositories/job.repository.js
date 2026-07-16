/**
 * job.repository.js - MongoDB Query Layer for Job Analyses
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const JobAnalysis = require("../models/JobAnalysis");
const Profile = require("../models/Profile");

const createJobAnalysis = async (data) => {
  if (data.source_hash) {
    const existing = await JobAnalysis.findOne({ source_hash: data.source_hash }).lean();
    if (existing) return existing;
  }
  const doc = await JobAnalysis.create({
    profile_id:            data.profile_id,
    job_title:             data.job_title,
    job_description:       data.job_description,
    required_skills:       data.required_skills       || [],
    nice_to_have_skills:   data.nice_to_have_skills   || [],
    experience_level:      data.experience_level,
    match_score:           data.match_score,
    skill_match_breakdown: data.skill_match_breakdown || {},
    strengths:             data.strengths             || [],
    gaps:                  data.gaps                  || [],
    hiring_readiness:      data.hiring_readiness,
    recommendations:       data.recommendations       || [],
    source_hash:           data.source_hash,
  });
  return doc.toObject();
};

const findById = async (id) => {
  return JobAnalysis.findById(id).lean();
};

/** Used by job.service.js to check cache by hash */
const findByHash = async (hash) => {
  return JobAnalysis.findOne({ source_hash: hash }).lean();
};

/** Used by job.controller.js - paginated job history for a username */
const findByUsername = async (username, page = 1, limit = 10) => {
  const profile = await Profile.findOne(
    { username: username.toLowerCase() },
    { _id: 1 }
  ).lean();
  if (!profile) return { data: [], total: 0, page, totalPages: 0 };

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    JobAnalysis.find({ profile_id: profile._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobAnalysis.countDocuments({ profile_id: profile._id }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
};

const findByProfileId = async (profileId) => {
  return JobAnalysis.find({ profile_id: profileId }).sort({ createdAt: -1 }).lean();
};

const deleteById = async (id) => {
  const result = await JobAnalysis.findByIdAndDelete(id);
  return !!result;
};

module.exports = {
  createJobAnalysis,
  findById,
  findByHash,
  findByUsername,
  findByProfileId,
  deleteById,
};
