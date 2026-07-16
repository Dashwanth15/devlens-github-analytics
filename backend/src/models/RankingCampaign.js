/**
 * models/RankingCampaign.js - Mongoose Schemas for Ranking Campaigns & Candidates
 * Replaces MySQL `ranking_campaigns` and `campaign_candidates` tables.
 */

const mongoose = require("mongoose");

// ── Campaign ──────────────────────────────────────────────────────────────────

const RankingCampaignSchema = new mongoose.Schema(
  {
    title:            { type: String, required: true },
    role_name:        { type: String },
    job_description:  { type: String, required: true },
    required_skills:  { type: [String], default: [] },
    status:           { type: String, default: "draft", enum: ["draft", "active", "analyzing", "complete", "closed"] },
  },
  { timestamps: true }
);

// ── Candidate ─────────────────────────────────────────────────────────────────

const CampaignCandidateSchema = new mongoose.Schema(
  {
    campaign_id:       { type: mongoose.Schema.Types.ObjectId, ref: "RankingCampaign", required: true },
    profile_id:        { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    username:          { type: String, required: true },
    rank:              { type: Number, default: null },
    rank_score:        { type: Number, default: 0 },
    job_match_score:   { type: Number, default: 0 },
    tech_fit_score:    { type: Number, default: 0 },
    repo_quality_score:{ type: Number, default: 0 },
    open_source_score: { type: Number, default: 0 },
    activity_score:    { type: Number, default: 0 },
    growth_score:      { type: Number, default: 0 },
    composite_score:   { type: Number, default: 0 },
    score_breakdown:   { type: mongoose.Schema.Types.Mixed, default: {} },
    strengths:         { type: [String], default: [] },
    gaps:              { type: [String], default: [] },
    recommendation:    { type: String },
    analysis_status:   { type: String, default: "pending", enum: ["pending", "analyzing", "complete", "error"] },
    analyzed_at:       { type: Date },
  },
  { timestamps: true }
);

// One candidate per campaign
CampaignCandidateSchema.index({ campaign_id: 1, profile_id: 1 }, { unique: true });

const RankingCampaign   = mongoose.model("RankingCampaign",   RankingCampaignSchema);
const CampaignCandidate = mongoose.model("CampaignCandidate", CampaignCandidateSchema);

module.exports = { RankingCampaign, CampaignCandidate };
