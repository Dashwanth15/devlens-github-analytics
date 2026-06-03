/**
 * job.repository.js - Database Query Layer for Job Analyses
 */

const { pool } = require("../config/db");

const createJobAnalysis = async (data) => {
  const sql = `
    INSERT INTO job_analyses (
      profile_id, job_title, job_description, required_skills,
      nice_to_have_skills, experience_level, match_score,
      skill_match_breakdown, strengths, gaps,
      hiring_readiness, recommendations, source_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    data.profile_id,
    data.job_title,
    data.job_description,
    JSON.stringify(data.required_skills),
    JSON.stringify(data.nice_to_have_skills),
    data.experience_level,
    data.match_score,
    JSON.stringify(data.skill_match_breakdown),
    JSON.stringify(data.strengths),
    JSON.stringify(data.gaps),
    data.hiring_readiness,
    JSON.stringify(data.recommendations),
    data.source_hash,
  ]);
  return findById(result.insertId);
};

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM job_analyses WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const findByHash = async (hash) => {
  const [rows] = await pool.query(
    "SELECT * FROM job_analyses WHERE source_hash = ? ORDER BY analyzed_at DESC LIMIT 1",
    [hash]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const findByUsername = async (username, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT ja.id, ja.job_title, ja.match_score, ja.hiring_readiness, ja.analyzed_at
     FROM job_analyses ja
     JOIN profiles p ON p.id = ja.profile_id
     WHERE p.username = ?
     ORDER BY ja.analyzed_at DESC
     LIMIT ? OFFSET ?`,
    [username.toLowerCase(), limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM job_analyses ja
     JOIN profiles p ON p.id = ja.profile_id WHERE p.username = ?`,
    [username.toLowerCase()]
  );
  return { data: rows, total, page, totalPages: Math.ceil(total / limit) };
};

const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM job_analyses WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

const parseJsonFields = (row) => ({
  ...row,
  required_skills:       safeJson(row.required_skills, []),
  nice_to_have_skills:   safeJson(row.nice_to_have_skills, []),
  skill_match_breakdown: safeJson(row.skill_match_breakdown, []),
  strengths:             safeJson(row.strengths, []),
  gaps:                  safeJson(row.gaps, []),
  recommendations:       safeJson(row.recommendations, []),
});

const safeJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

module.exports = { createJobAnalysis, findById, findByHash, findByUsername, deleteById };
