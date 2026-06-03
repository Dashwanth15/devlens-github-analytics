/**
 * ranking.service.js - Candidate Ranking Engine
 *
 * Orchestrates the full recruiter pipeline:
 * - Creates/manages ranking campaigns
 * - Scores each candidate across 6 dimensions
 * - Computes composite score with weighted formula
 * - Produces a ranked leaderboard
 *
 * COMPOSITE SCORE WEIGHTS:
 *   Job Match Score    30%  (how well they fit THIS specific job)
 *   Tech Fit           20%  (language overlap with job requirements)
 *   Repo Quality       15%  (stars, original repos)
 *   Open Source Impact 15%  (forks received = others build on their work)
 *   Activity Score     10%  (account age + repo recency)
 *   Growth Score       10%  (career trajectory)
 */

const geminiService = require("./gemini.service");
const jobService = require("./job.service");
const careerService = require("./career.service");
const profileRepository = require("../repositories/profile.repository");
const analyzerService = require("./analyzer.service");
const rankingRepository = require("../repositories/ranking.repository");

// ─── Sub-scorers ──────────────────────────────────────────────────────────────

const normalize = (str) =>
  str.toLowerCase().replace(/[.\-_\s]/g, "").replace(/js$/, "");

/**
 * Tech fit: % of required skills evidenced in developer's language stack
 */
const computeTechFit = (profile, repos, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) return 50;

  const langDist = repos.reduce((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});

  const allLangs = Object.keys(langDist).map(normalize);
  const repoTexts = repos.map(
    (r) => normalize(r.repo_name || "") + " " + normalize(r.description || "")
  );

  let hits = 0;
  for (const skill of requiredSkills) {
    const normSkill = normalize(skill);
    if (
      allLangs.some((l) => l === normSkill) ||
      repoTexts.some((t) => t.includes(normSkill))
    ) {
      hits++;
    }
  }
  return Math.round((hits / requiredSkills.length) * 100);
};

/**
 * Repo quality: based on stars and original (non-fork) repo count
 */
const computeRepoQuality = (profile, repos) => {
  const originalRepos = repos.filter((r) => !r.is_fork);
  const starScore = Math.min(100, (Math.log10(profile.total_stars + 1) / Math.log10(1001)) * 100);
  const repoCountScore = Math.min(100, (originalRepos.length / 30) * 100);
  return Math.round((starScore * 0.6 + repoCountScore * 0.4) * 10) / 10;
};

/**
 * Open source impact: forks received = others are using your code
 */
const computeOpenSourceScore = (profile) => {
  const forkScore = Math.min(100, (Math.log10(profile.total_forks + 1) / Math.log10(201)) * 100);
  const followerScore = Math.min(100, (Math.log10(profile.followers + 1) / Math.log10(501)) * 100);
  return Math.round((forkScore * 0.6 + followerScore * 0.4) * 10) / 10;
};

/**
 * Activity score: account maturity + recent engagement signals
 */
const computeActivityScore = (profile) => {
  const ageScore = Math.min(100, (profile.account_age_days / 1825) * 100); // 5 years = 100
  const repoScore = Math.min(100, (profile.public_repos / 40) * 100);
  return Math.round((ageScore * 0.5 + repoScore * 0.5) * 10) / 10;
};

// ─── Main Campaign Functions ──────────────────────────────────────────────────

/**
 * Create a new ranking campaign
 */
const createCampaign = async (title, roleName, jobDescription) => {
  // Extract required skills for later use in scoring
  let requiredSkills = [];
  try {
    const jobReqs = await geminiService.extractJobRequirements(jobDescription);
    requiredSkills = jobReqs.required_skills || [];
  } catch {
    // If Gemini fails, proceed without pre-extracted skills
  }

  return rankingRepository.createCampaign({
    title,
    role_name: roleName,
    job_description: jobDescription,
    required_skills: requiredSkills,
    status: "draft",
  });
};

/**
 * Add a candidate to a campaign
 * Auto-analyzes their GitHub profile if not already in DB
 */
const addCandidate = async (campaignId, username) => {
  const campaign = await rankingRepository.getCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  // Auto-analyze profile if it doesn't exist
  let profile = await profileRepository.findByUsername(username);
  if (!profile) {
    const result = await analyzerService.analyzeProfile(username);
    profile = result.profile;
  }

  return rankingRepository.addCandidate(campaignId, profile.id, username);
};

/**
 * Score and rank all candidates in a campaign
 */
const rankCampaign = async (campaignId) => {
  const campaign = await rankingRepository.getCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  await rankingRepository.updateCampaignStatus(campaignId, "analyzing");

  const candidates = await rankingRepository.getCandidates(campaignId);
  const requiredSkills = campaign.required_skills || [];

  // Score all candidates in parallel
  const scoredCandidates = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await rankingRepository.updateCandidateStatus(candidate.id, "analyzing");

        const profile = await profileRepository.findByUsername(candidate.username);
        if (!profile) throw new Error("Profile not found");

        const repos = await profileRepository.getRepositoriesByProfileId(profile.id);

        // Job match (runs AI + caching)
        let jobMatchScore = 50;
        try {
          const jobMatch = await jobService.matchJob(
            candidate.username,
            campaign.job_description
          );
          jobMatchScore = jobMatch.match_score;
        } catch { /* use default */ }

        // Career growth score
        let growthScore = 50;
        try {
          const career = await careerService.predictCareerGrowth(candidate.username);
          growthScore = career.growth_score;
        } catch { /* use default */ }

        // Sub-scores
        const techFitScore = computeTechFit(profile, repos, requiredSkills);
        const repoQualityScore = computeRepoQuality(profile, repos);
        const openSourceScore = computeOpenSourceScore(profile);
        const activityScore = computeActivityScore(profile);

        // Composite weighted score
        const compositeScore = Math.round(
          (jobMatchScore     * 0.30 +
           techFitScore      * 0.20 +
           repoQualityScore  * 0.15 +
           openSourceScore   * 0.15 +
           activityScore     * 0.10 +
           growthScore       * 0.10) * 10
        ) / 10;

        const scoreBreakdown = {
          job_match:    { score: jobMatchScore,    weight: 0.30, label: "Job Match" },
          tech_fit:     { score: techFitScore,     weight: 0.20, label: "Tech Fit" },
          repo_quality: { score: repoQualityScore, weight: 0.15, label: "Repo Quality" },
          open_source:  { score: openSourceScore,  weight: 0.15, label: "Open Source Impact" },
          activity:     { score: activityScore,    weight: 0.10, label: "Activity Score" },
          growth:       { score: growthScore,      weight: 0.10, label: "Career Growth" },
        };

        await rankingRepository.updateCandidateScores(candidate.id, {
          job_match_score: jobMatchScore,
          tech_fit_score: techFitScore,
          repo_quality_score: repoQualityScore,
          open_source_score: openSourceScore,
          activity_score: activityScore,
          growth_score: growthScore,
          composite_score: compositeScore,
          score_breakdown: scoreBreakdown,
          analysis_status: "complete",
          analyzed_at: new Date(),
        });

        return { candidateId: candidate.id, compositeScore };
      } catch (err) {
        await rankingRepository.updateCandidateStatus(candidate.id, "error");
        return { candidateId: candidate.id, compositeScore: 0 };
      }
    })
  );

  // Assign ranks by composite score descending
  const sorted = scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
  await Promise.all(
    sorted.map((c, idx) =>
      rankingRepository.updateCandidateRank(c.candidateId, idx + 1)
    )
  );

  await rankingRepository.updateCampaignStatus(campaignId, "complete");

  return rankingRepository.getCampaignWithCandidates(campaignId);
};

module.exports = { createCampaign, addCandidate, rankCampaign };
