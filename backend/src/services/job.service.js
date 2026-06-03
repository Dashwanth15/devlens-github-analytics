/**
 * job.service.js - Job Match Engine
 *
 * FLOW:
 * 1. Hash job description → check cache (avoid duplicate AI calls)
 * 2. AI-extract job requirements (gemini.service)
 * 3. Load profile + repos from DB
 * 4. Algorithmic skill matching against GitHub evidence
 * 5. Compute match score, hiring readiness, strengths, gaps
 * 6. Persist and return
 */

const crypto = require("crypto");
const geminiService = require("./gemini.service");
const profileRepository = require("../repositories/profile.repository");
const jobRepository = require("../repositories/job.repository");
const analyzerService = require("./analyzer.service");

// ─── Skill Normalizer ─────────────────────────────────────────────────────────

const normalize = (str) =>
  str.toLowerCase().replace(/[.\-_\s]/g, "").replace(/js$/, "");

/**
 * Check if a skill has evidence in the developer's GitHub profile
 * Returns match level: "full" | "partial" | "none"
 */
const checkSkillEvidence = (skill, repos, languageDistribution) => {
  const normSkill = normalize(skill);

  // Check primary language match
  const langMatch = Object.keys(languageDistribution).find(
    (k) => normalize(k) === normSkill
  );
  if (langMatch && languageDistribution[langMatch] >= 2) return "full";
  if (langMatch && languageDistribution[langMatch] >= 1) return "partial";

  // Check repo names + descriptions
  let nameHits = 0;
  let descHits = 0;
  for (const repo of repos) {
    if (normalize(repo.repo_name || "").includes(normSkill)) nameHits++;
    if (normalize(repo.description || "").includes(normSkill)) descHits++;
  }
  if (nameHits >= 2 || descHits >= 3) return "full";
  if (nameHits >= 1 || descHits >= 1) return "partial";

  return "none";
};

/**
 * Map experience level string to numeric tier for comparison
 */
const experienceLevelTier = (level) => {
  const tiers = { junior: 1, mid: 2, senior: 3, lead: 4, principal: 5 };
  return tiers[level?.toLowerCase()] || 2;
};

/**
 * Estimate candidate's experience level from profile metrics
 */
const inferCandidateLevel = (profile) => {
  const score =
    (profile.public_repos > 40 ? 2 : profile.public_repos > 15 ? 1 : 0) +
    (profile.total_stars > 500 ? 2 : profile.total_stars > 100 ? 1 : 0) +
    (profile.followers > 200 ? 2 : profile.followers > 50 ? 1 : 0) +
    (profile.account_age_days > 1825 ? 2 : profile.account_age_days > 730 ? 1 : 0);

  if (score >= 6) return "senior";
  if (score >= 4) return "mid";
  if (score >= 2) return "junior";
  return "junior";
};

// ─── Main Match Function ──────────────────────────────────────────────────────

/**
 * Run job match analysis for a developer against a job description
 * @param {string} username
 * @param {string} jobDescription
 * @param {string} [jobTitle]
 * @returns {Object} Full job match report
 */
const matchJob = async (username, jobDescription, jobTitle = null) => {
  // ── 1. Check cache: same job + same profile = return stored result ──────────
  const sourceHash = crypto
    .createHash("sha256")
    .update(username + jobDescription)
    .digest("hex");

  const cached = await jobRepository.findByHash(sourceHash);
  if (cached) {
    return { ...cached, cached: true };
  }

  // ── 2. Load profile ────────────────────────────────────────────────────────
  let profile = await profileRepository.findByUsername(username);
  if (!profile) {
    try {
      const result = await analyzerService.analyzeProfile(username);
      profile = result.profile;
    } catch (err) {
      throw new Error(`Profile for '${username}' could not be analyzed: ${err.message}`);
    }
  }

  const repos = await profileRepository.getRepositoriesByProfileId(profile.id);

  // Build language distribution
  const languageDistribution = repos.reduce((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});

  // ── 3. AI: extract job requirements ────────────────────────────────────────
  const jobReqs = await geminiService.extractJobRequirements(jobDescription);

  const requiredSkills = jobReqs.required_skills || [];
  const niceToHave = jobReqs.nice_to_have || [];

  // ── 4. Match required skills ───────────────────────────────────────────────
  const skillBreakdown = [];

  const matchRequired = requiredSkills.map((skill) => {
    const level = checkSkillEvidence(skill, repos, languageDistribution);
    const row = {
      skill,
      required: true,
      match_level: level,
      status: level === "full" ? "verified" : level === "partial" ? "partial" : "missing",
    };
    skillBreakdown.push(row);
    return row;
  });

  const matchOptional = niceToHave.map((skill) => {
    const level = checkSkillEvidence(skill, repos, languageDistribution);
    const row = {
      skill,
      required: false,
      match_level: level,
      status: level === "full" ? "verified" : level === "partial" ? "partial" : "missing",
    };
    skillBreakdown.push(row);
    return row;
  });

  // ── 5. Score computation ───────────────────────────────────────────────────
  const requiredMatched = matchRequired.filter(
    (r) => r.match_level === "full" || r.match_level === "partial"
  ).length;
  const requiredFullMatched = matchRequired.filter(
    (r) => r.match_level === "full"
  ).length;

  const optionalMatched = matchOptional.filter(
    (r) => r.match_level !== "none"
  ).length;

  const requiredRate =
    requiredSkills.length > 0 ? requiredMatched / requiredSkills.length : 1;
  const optionalRate =
    niceToHave.length > 0 ? optionalMatched / niceToHave.length : 0.5;

  const candidateLevel = inferCandidateLevel(profile);
  const requiredLevel = jobReqs.experience_level || "mid";
  const candidateTier = experienceLevelTier(candidateLevel);
  const requiredTier = experienceLevelTier(requiredLevel);
  const experienceScore = Math.max(0, Math.min(1, 1 - (requiredTier - candidateTier) * 0.25));

  const matchScore = Math.round(
    (requiredRate * 60 + optionalRate * 20 + experienceScore * 20) * 10
  ) / 10;

  // ── 6. Strengths, gaps, readiness ─────────────────────────────────────────
  const strengths = [];
  const gaps = [];

  if (requiredFullMatched === requiredSkills.length && requiredSkills.length > 0) {
    strengths.push("All required technical skills are evidenced in GitHub activity");
  }
  if (profile.total_stars > 100) {
    strengths.push(`Strong open source presence (${profile.total_stars} total stars)`);
  }
  if (profile.followers > 50) {
    strengths.push(`Recognized developer with ${profile.followers} GitHub followers`);
  }
  if (requiredSkills.length > 0 && requiredFullMatched / requiredSkills.length > 0.7) {
    strengths.push("Core technology stack is well-matched to role requirements");
  }

  matchRequired
    .filter((r) => r.match_level === "none")
    .forEach((r) => gaps.push(`No GitHub evidence for required skill: ${r.skill}`));

  if (candidateTier < requiredTier - 1) {
    gaps.push(`Experience level appears ${candidateLevel} but role requires ${requiredLevel}`);
  }

  let hiringReadiness;
  const allRequiredMet = matchRequired.every((r) => r.match_level !== "none");
  if (matchScore >= 85 && allRequiredMet) hiringReadiness = "exceptional";
  else if (matchScore >= 70) hiringReadiness = "ready";
  else if (matchScore >= 50) hiringReadiness = "developing";
  else hiringReadiness = "not_ready";

  // ── 7. Recommendations ────────────────────────────────────────────────────
  const recommendations = [];
  matchRequired
    .filter((r) => r.match_level === "none")
    .slice(0, 3)
    .forEach((r) =>
      recommendations.push(
        `Build a project using ${r.skill} to demonstrate hands-on experience`
      )
    );
  if (candidateTier < requiredTier) {
    recommendations.push(
      "Contribute to larger projects or take on technical leadership roles to bridge experience gap"
    );
  }
  if (profile.total_stars < 20) {
    recommendations.push("Polish existing repos with documentation, tests, and CI/CD pipelines");
  }

  // ── 8. Persist and return ─────────────────────────────────────────────────
  const saved = await jobRepository.createJobAnalysis({
    profile_id: profile.id,
    job_title: jobTitle || jobReqs.job_title || null,
    job_description: jobDescription.slice(0, 5000),
    required_skills: requiredSkills,
    nice_to_have_skills: niceToHave,
    experience_level: requiredLevel,
    match_score: matchScore,
    skill_match_breakdown: skillBreakdown,
    strengths,
    gaps,
    hiring_readiness: hiringReadiness,
    recommendations,
    source_hash: sourceHash,
  });

  return {
    id: saved.id,
    username,
    job_title: jobTitle || jobReqs.job_title,
    match_score: matchScore,
    hiring_readiness: hiringReadiness,
    required_skills: requiredSkills,
    nice_to_have_skills: niceToHave,
    skill_match_breakdown: skillBreakdown,
    strengths,
    gaps,
    recommendations,
    cached: false,
  };
};

module.exports = { matchJob };
