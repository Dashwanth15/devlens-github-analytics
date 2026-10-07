/**
 * models/ResumeAnalysis.js - Mongoose Schema for Resume Analyses
 * Replaces the MySQL `resume_analyses` table.
 */

const mongoose = require("mongoose");

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    profile_id:              { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true, unique: true },
    resume_filename:         { type: String },
    resume_text:             { type: String },
    extracted_skills:        { type: [String], default: [] },
    extracted_technologies:  { type: [String], default: [] },
    extracted_projects:      { type: [String], default: [] },
    experience_years:        { type: Number, default: 0 },
    verification_score:      { type: Number, default: 0 },
    skill_confidence_score:  { type: Number, default: 0 },
    verification_report:     { type: mongoose.Schema.Types.Mixed, default: [] },
    missing_evidence:        { type: [String], default: [] },
    strengths:               { type: [String], default: [] },
    evidence_gaps:           { type: [String], default: [] },
    recommendations:         { type: [String], default: [] },
    repositories_analyzed:   { type: mongoose.Schema.Types.Mixed, default: [] },
    non_verifiable_skills:   { type: [String], default: [] },
    analyzed_at:             { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
