/**
 * ranking.repository.js - Database Query Layer for Ranking Campaigns & Candidates
 */

const { pool } = require("../config/db");

// ── Campaigns ─────────────────────────────────────────────────

const createCampaign = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO ranking_campaigns (title, role_name, job_description, required_skills, status)
     VALUES (?, ?, ?, ?, ?)`,
    [data.title, data.role_name, data.job_description, JSON.stringify(data.required_skills), data.status]
  );
  return getCampaignById(result.insertId);
};

const getCampaignById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM ranking_campaigns WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows[0]) return null;
  return parseCampaign(rows[0]);
};

const getAllCampaigns = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT rc.*, COUNT(cc.id) as candidate_count
     FROM ranking_campaigns rc
     LEFT JOIN campaign_candidates cc ON cc.campaign_id = rc.id
     GROUP BY rc.id
     ORDER BY rc.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) as total FROM ranking_campaigns"
  );
  return { data: rows.map(parseCampaign), total, page, totalPages: Math.ceil(total / limit) };
};

const updateCampaignStatus = async (id, status) => {
  await pool.query("UPDATE ranking_campaigns SET status = ? WHERE id = ?", [status, id]);
};

const deleteCampaign = async (id) => {
  const [result] = await pool.query("DELETE FROM ranking_campaigns WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

// ── Candidates ────────────────────────────────────────────────

const addCandidate = async (campaignId, profileId, username) => {
  // Ignore if already added
  await pool.query(
    `INSERT IGNORE INTO campaign_candidates (campaign_id, profile_id, username)
     VALUES (?, ?, ?)`,
    [campaignId, profileId, username.toLowerCase()]
  );
  const [rows] = await pool.query(
    "SELECT * FROM campaign_candidates WHERE campaign_id = ? AND profile_id = ?",
    [campaignId, profileId]
  );
  return rows[0];
};

const getCandidates = async (campaignId) => {
  const [rows] = await pool.query(
    "SELECT * FROM campaign_candidates WHERE campaign_id = ? ORDER BY composite_score DESC",
    [campaignId]
  );
  return rows.map(parseCandidate);
};

const getCampaignWithCandidates = async (campaignId) => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) return null;
  const candidates = await getCandidates(campaignId);
  return { ...campaign, candidates };
};

const updateCandidateScores = async (id, scores) => {
  await pool.query(
    `UPDATE campaign_candidates SET
      job_match_score    = ?,
      tech_fit_score     = ?,
      repo_quality_score = ?,
      open_source_score  = ?,
      activity_score     = ?,
      growth_score       = ?,
      composite_score    = ?,
      score_breakdown    = ?,
      analysis_status    = ?,
      analyzed_at        = ?
     WHERE id = ?`,
    [
      scores.job_match_score,
      scores.tech_fit_score,
      scores.repo_quality_score,
      scores.open_source_score,
      scores.activity_score,
      scores.growth_score,
      scores.composite_score,
      JSON.stringify(scores.score_breakdown),
      scores.analysis_status,
      scores.analyzed_at,
      id,
    ]
  );
};

const updateCandidateStatus = async (id, status) => {
  await pool.query(
    "UPDATE campaign_candidates SET analysis_status = ? WHERE id = ?",
    [status, id]
  );
};

const updateCandidateRank = async (id, rank) => {
  await pool.query(
    "UPDATE campaign_candidates SET rank_position = ? WHERE id = ?",
    [rank, id]
  );
};

const removeCandidateByUsername = async (campaignId, username) => {
  const [result] = await pool.query(
    "DELETE FROM campaign_candidates WHERE campaign_id = ? AND username = ?",
    [campaignId, username.toLowerCase()]
  );
  return result.affectedRows > 0;
};

// ── Parsers ───────────────────────────────────────────────────

const safeJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const parseCampaign = (row) => ({
  ...row,
  required_skills: safeJson(row.required_skills, []),
});

const parseCandidate = (row) => ({
  ...row,
  score_breakdown: safeJson(row.score_breakdown, {}),
});

module.exports = {
  createCampaign, getCampaignById, getAllCampaigns, updateCampaignStatus, deleteCampaign,
  addCandidate, getCandidates, getCampaignWithCandidates,
  updateCandidateScores, updateCandidateStatus, updateCandidateRank, removeCandidateByUsername,
};
