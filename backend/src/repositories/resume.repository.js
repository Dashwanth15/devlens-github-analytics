/**
 * resume.repository.js - Database Query Layer for Resume Analyses
 */

const { pool } = require("../config/db");

const upsertResumeAnalysis = async (data) => {
  // DELETE existing then INSERT fresh (simpler than ON DUPLICATE KEY with JSON cols)
  await pool.query("DELETE FROM resume_analyses WHERE profile_id = ?", [data.profile_id]);

  const sql = `
    INSERT INTO resume_analyses (
      profile_id, resume_filename, resume_text,
      extracted_skills, extracted_technologies, extracted_projects,
      experience_years, verification_score, skill_confidence_score,
      verification_report, missing_evidence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.query(sql, [
    data.profile_id,
    data.resume_filename,
    data.resume_text,
    JSON.stringify(data.extracted_skills),
    JSON.stringify(data.extracted_technologies),
    JSON.stringify(data.extracted_projects),
    data.experience_years,
    data.verification_score,
    data.skill_confidence_score,
    JSON.stringify(data.verification_report),
    JSON.stringify(data.missing_evidence),
  ]);

  return findByProfileId(data.profile_id);
};

const findByProfileId = async (profileId) => {
  const [rows] = await pool.query(
    "SELECT * FROM resume_analyses WHERE profile_id = ? LIMIT 1",
    [profileId]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const findByUsername = async (username) => {
  const [rows] = await pool.query(
    `SELECT ra.* FROM resume_analyses ra
     JOIN profiles p ON p.id = ra.profile_id
     WHERE p.username = ? LIMIT 1`,
    [username.toLowerCase()]
  );
  if (!rows[0]) return null;
  return parseJsonFields(rows[0]);
};

const deleteByUsername = async (username) => {
  const [result] = await pool.query(
    `DELETE ra FROM resume_analyses ra
     JOIN profiles p ON p.id = ra.profile_id
     WHERE p.username = ?`,
    [username.toLowerCase()]
  );
  return result.affectedRows > 0;
};

const parseJsonFields = (row) => ({
  ...row,
  extracted_skills:       safeJson(row.extracted_skills, []),
  extracted_technologies: safeJson(row.extracted_technologies, []),
  extracted_projects:     safeJson(row.extracted_projects, []),
  verification_report:    safeJson(row.verification_report, []),
  missing_evidence:       safeJson(row.missing_evidence, []),
});

const safeJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

module.exports = { upsertResumeAnalysis, findByProfileId, findByUsername, deleteByUsername };
