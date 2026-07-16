/**
 * models/JobAnalysis.js - Mongoose Schema for Job Match Analyses
 * Replaces the MySQL `job_analyses` table.
 */

const mongoose = require("mongoose");

const JobAnalysisSchema = new mongoose.Schema(
  {
    profile_id:           { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    job_title:            { type: String, required: true },
    job_description:      { type: String, required: true },
    required_skills:      { type: [String], default: [] },
    nice_to_have_skills:  { type: [String], default: [] },
    experience_level:     { type: String },
    match_score:          { type: Number, default: 0 },
    skill_match_breakdown:{ type: mongoose.Schema.Types.Mixed, default: {} },
    strengths:            { type: [String], default: [] },
    gaps:                 { type: [String], default: [] },
    hiring_readiness:     { type: String },
    recommendations:      { type: [String], default: [] },
    source_hash:          { type: String },
  },
  { timestamps: true }
);

// Compound index: one analysis per profile + job hash
JobAnalysisSchema.index({ profile_id: 1, source_hash: 1 });

module.exports = mongoose.model("JobAnalysis", JobAnalysisSchema);
