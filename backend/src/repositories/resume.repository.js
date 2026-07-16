/**
 * resume.repository.js - MongoDB Query Layer for Resume Analyses
 * Migrated from MySQL → MongoDB (Mongoose)
 */

const ResumeAnalysis = require("../models/ResumeAnalysis");

/**
 * Upsert a resume analysis for a profile (one resume per profile)
 */
const upsertResumeAnalysis = async (data) => {
  const filter  = { profile_id: data.profile_id };
  const update  = {
    $set: {
      resume_filename:          data.resume_filename,
      resume_text:              data.resume_text,
      extracted_skills:         data.extracted_skills        || [],
      extracted_technologies:   data.extracted_technologies  || [],
      extracted_projects:       data.extracted_projects      || [],
      experience_years:         data.experience_years,
      verification_score:       data.verification_score,
      skill_confidence_score:   data.skill_confidence_score,
      verification_report:      data.verification_report     || {},
      missing_evidence:         data.missing_evidence        || [],
      analyzed_at:              new Date(),
    },
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const doc = await ResumeAnalysis.findOneAndUpdate(filter, update, options);
  return doc.toObject();
};

/**
 * Get resume analysis for a profile
 */
const findByProfileId = async (profileId) => {
  return ResumeAnalysis.findOne({ profile_id: profileId }).lean();
};

module.exports = {
  upsertResumeAnalysis,
  findByProfileId,
};
