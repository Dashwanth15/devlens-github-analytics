/**
 * career.repository.js - Database Query Layer for Career Predictions
 */

const { pool } = require("../config/db");

const upsertCareerPrediction = async (data) => {
  const sql = `
    INSERT INTO career_predictions (
      profile_id, current_level, predicted_level, growth_score,
      growth_potential, timeline_months, factor_breakdown, recommendations
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      current_level    = VALUES(current_level),
      predicted_level  = VALUES(predicted_level),
      growth_score     = VALUES(growth_score),
      growth_potential = VALUES(growth_potential),
      timeline_months  = VALUES(timeline_months),
      factor_breakdown = VALUES(factor_breakdown),
      recommendations  = VALUES(recommendations),
      predicted_at     = CURRENT_TIMESTAMP
  `;
  await pool.query(sql, [
    data.profile_id,
    data.current_level,
    data.predicted_level,
    data.growth_score,
    data.growth_potential,
    data.timeline_months,
    JSON.stringify(data.factor_breakdown),
    JSON.stringify(data.recommendations),
  ]);
  return findByProfileId(data.profile_id);
};

const findByProfileId = async (profileId) => {
  const [rows] = await pool.query(
    "SELECT * FROM career_predictions WHERE profile_id = ? LIMIT 1",
    [profileId]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const findByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT cp.* FROM career_predictions cp
     JOIN profiles p ON p.id = cp.profile_id
     WHERE p.username = ? LIMIT 1`,
    [username.toLowerCase()]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const deleteByUsername = async (username) => {
  const [result] = await pool.query(
    `DELETE cp FROM career_predictions cp
     JOIN profiles p ON p.id = cp.profile_id
     WHERE p.username = ?`,
    [username.toLowerCase()]
  );
  return result.affectedRows > 0;
};

const parseJsonFields = (row) => ({
  ...row,
  factor_breakdown: safeJson(row.factor_breakdown, {}),
  recommendations:  safeJson(row.recommendations, []),
});

const safeJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

module.exports = { upsertCareerPrediction, findByProfileId, findByUsername, deleteByUsername };
