/**
 * resume.repository.js - MongoDB Query Layer for Resume Analyses
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const ResumeAnalysis = require("../models/ResumeAnalysis");
const Profile = require("../models/Profile");

const upsertResumeAnalysis = async (data) => {
  const filter  = { profile_id: data.profile_id };
  const update  = {
    $set: {
      resume_filename:         data.resume_filename,
      resume_text:             data.resume_text,
      extracted_skills:        data.extracted_skills       || [],
      extracted_technologies:  data.extracted_technologies || [],
      extracted_projects:      data.extracted_projects     || [],
      experience_years:        data.experience_years,
      verification_score:      data.verification_score,
      skill_confidence_score:  data.skill_confidence_score,
      verification_report:     data.verification_report    || {},
      missing_evidence:        data.missing_evidence       || [],
      analyzed_at:             new Date(),
    },
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await ResumeAnalysis.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

const findByProfileId = async (profileId) => {
  return ResumeAnalysis.findOne({ profile_id: profileId }).lean();
};

/** Used by resume.controller.js — looks up by username */
const findByUsername = async (username) => {
  const profile = await Profile.findOne(
    { username: username.toLowerCase() },
    { _id: 1 }
  ).lean();
  if (!profile) return null;
  return ResumeAnalysis.findOne({ profile_id: profile._id }).lean();
};

/** Used by resume.controller.js — deletes by username */
const deleteByUsername = async (username) => {
  const profile = await Profile.findOne(
    { username: username.toLowerCase() },
    { _id: 1 }
  ).lean();
  if (!profile) return false;
  const result = await ResumeAnalysis.deleteOne({ profile_id: profile._id });
  return result.deletedCount > 0;
};

module.exports = {
  upsertResumeAnalysis,
  findByProfileId,
  findByUsername,
  deleteByUsername,
};
