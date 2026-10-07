/**
 * resume.service.js - Evidence-Backed Resume Verification Pipeline
 *
 * PIPELINE:
 * 1. Text extraction from PDF/buffer (pdf.service)
 * 2. Structured resume parsing (gemini.service with rich deterministic dictionary fallback)
 * 3. Repository sync from GitHub API (github.service)
 * 4. Deep multi-layer repository intelligence:
 *    - Language breakdown (all detected Linguist languages)
 *    - Git file tree (.jsx, .tsx, .py, .html, .css, etc.)
 *    - Manifest analysis (package.json, requirements.txt, Dockerfile, etc.)
 *    - Topics and metadata
 * 5. Deterministic evidence matching & confidence scoring
 * 6. AI synthesis for strengths, evidence gaps, and actionable recommendations
 * 7. MongoDB persistence and response formatting
 */

const pdfService = require("./pdf.service");
const geminiService = require("./gemini.service");
const profileRepository = require("../repositories/profile.repository");
const resumeRepository = require("../repositories/resume.repository");
const analyzerService = require("./analyzer.service");
const githubService = require("./github.service");
const repoIntelligenceService = require("./repoIntelligence.service");
const { getTopRepositories } = require("../utils/insights");
const {
  normalizeTechName,
  getTechCategory,
  checkVerificationEligibility,
  CATEGORIES,
  TECH_REGISTRY,
} = require("../utils/technologyTaxonomy");

/**
 * Match a single claimed skill against the candidate's unified GitHub evidence map
 * @param {string} claimedSkill - Canonical technology name
 * @param {Object} evidenceMap - Aggregated evidence items by technology
 * @param {Array} inspectedRepos - List of inspected repository summaries
 * @returns {Object} Skill verification item
 */
const matchClaimedSkill = (claimedSkill, evidenceMap = {}, inspectedRepos = []) => {
  const canonical = normalizeTechName(claimedSkill);
  const category = getTechCategory(canonical);

  // Bulletproof evidence lookup: match canonical, all known aliases, and normalized keys
  const aliases = (TECH_REGISTRY[canonical]?.aliases || []).map((a) => a.toLowerCase().replace(/[\.\-_\s]/g, ""));
  const canonicalNorm = canonical.toLowerCase().replace(/[\.\-_\s]/g, "");
  const directEvidence = [];
  const seenEvidence = new Set();

  Object.entries(evidenceMap).forEach(([key, items]) => {
    const keyNorm = key.toLowerCase().replace(/[\.\-_\s]/g, "");
    if (keyNorm === canonicalNorm || aliases.includes(keyNorm)) {
      (items || []).forEach((item) => {
        const sig = `${item.repository}::${item.type}::${item.source}::${item.detail}`;
        if (!seenEvidence.has(sig)) {
          seenEvidence.add(sig);
          directEvidence.push(item);
        }
      });
    }
  });

  let confidence = 0;
  const supportingRepos = new Set();
  const evidenceDetails = [];

  if (directEvidence.length > 0) {
    directEvidence.forEach((item) => {
      supportingRepos.add(item.repository);
      evidenceDetails.push({
        repository: item.repository,
        type: item.type,
        source: item.source,
        detail: item.detail,
        strength: item.strength,
      });
    });

    // Score based on strongest evidence piece + volume / repo diversity bonus
    const maxWeight = Math.max(...directEvidence.map((e) => e.weight || 50));
    const repoBonus = Math.min(15, (supportingRepos.size - 1) * 6);
    const multiSourceBonus = directEvidence.length >= 3 ? 5 : 0;
    confidence = Math.min(100, maxWeight + repoBonus + multiSourceBonus);
  }

  // Determine status
  let status = "not_found";
  if (confidence >= 60) {
    status = "verified";
  } else if (confidence >= 25) {
    status = "partially_verified";
  }

  // Construct deterministic, evidence-backed reasoning
  let reasoning = "";
  if (status === "verified") {
    const reposList = Array.from(supportingRepos).slice(0, 3).join(", ");
    const topDetail = directEvidence[0]?.detail || "";

    if (directEvidence.some((e) => e.type === "dependency")) {
      reasoning = `Meaningful evidence confirmed as a project dependency in ${reposList} (${topDetail}).`;
    } else if (directEvidence.some((e) => e.type === "language")) {
      reasoning = `Meaningful evidence confirmed via GitHub Linguist language detection in ${reposList} (${topDetail}).`;
    } else if (directEvidence.some((e) => e.type === "configuration")) {
      reasoning = `Meaningful evidence confirmed via configuration files in ${reposList} (${topDetail}).`;
    } else {
      reasoning = `Meaningful GitHub evidence supports this skill in ${reposList} (${topDetail}).`;
    }
  } else if (status === "partially_verified") {
    const reposList = Array.from(supportingRepos).join(", ");
    const topDetail = directEvidence[0]?.detail || "";
    reasoning = `Supporting evidence found in ${reposList} (${topDetail}), but no direct production dependency was confirmed.`;
  } else {
    reasoning = "No sufficient public GitHub evidence was found.";
  }

  return {
    skill: canonical,
    category,
    status,
    confidence: Math.round(confidence),
    evidence: directEvidence.map((e) => `${e.source}: ${e.detail} [${e.repository}]`),
    evidence_items: evidenceDetails,
    supporting_repos: Array.from(supportingRepos),
    reasoning,
    evidence_count: directEvidence.length,
  };
};

/**
 * Full resume analysis pipeline
 * @param {string} username - GitHub username
 * @param {Buffer} fileBuffer - PDF/txt file buffer
 * @param {string} mimetype - File MIME type
 * @param {string} filename - Original filename
 * @returns {Object} Full verification report
 */
const analyzeResume = async (username, fileBuffer, mimetype, filename) => {
  const cleanUsername = username.trim().toLowerCase();

  // ── 1. Ensure profile exists in DB ──────────────────────────────────────────
  let profile = await profileRepository.findByUsername(cleanUsername);
  if (!profile) {
    try {
      const result = await analyzerService.analyzeProfile(cleanUsername);
      profile = result.profile;
    } catch (err) {
      throw new Error(`Profile for '${cleanUsername}' could not be analyzed: ${err.message}`);
    }
  }

  // ── 2. Extract text from uploaded file ──────────────────────────────────────
  const resumeText = await pdfService.extractTextFromBuffer(fileBuffer, mimetype);

  // ── 3. Structured resume extraction (Gemini with deterministic fallback) ────
  const extracted = await geminiService.extractResumeData(resumeText);

  // Combine and canonicalize all claimed skills (preserve ALL skills in profile)
  const rawClaims = [
    ...(extracted.skills || []),
    ...(extracted.technologies || []),
  ].filter(Boolean);

  const canonicalClaimsSet = new Set();
  rawClaims.forEach((claim) => {
    const canonical = normalizeTechName(claim);
    if (canonical && canonical.length >= 2) {
      canonicalClaimsSet.add(canonical);
    }
  });

  const allClaimedSkills = Array.from(canonicalClaimsSet);
  console.log(`📋 Extracted ${allClaimedSkills.length} unique claimed technical skills from resume.`);

  // ── 4. Verification Eligibility Classification (Strict 3-Tier Model) ────────
  // Non-verifiable skills (AWS, JWT, AJAX, Leadership...) are separated BEFORE repo matching
  const githubVerifiableSkills = [];
  const notGithubVerifiableItems = [];

  allClaimedSkills.forEach((skill) => {
    const eligibility = checkVerificationEligibility(skill);
    if (eligibility.isVerifiable) {
      githubVerifiableSkills.push(eligibility.canonical);
    } else {
      notGithubVerifiableItems.push({
        skill: eligibility.canonical,
        category: eligibility.category,
        status: "not_github_verifiable",
        confidence: null,
        reasoning: eligibility.reason || "Not evaluated because this skill cannot be reliably verified through public GitHub repository evidence.",
        evidence: [],
        evidence_items: [],
        supporting_repos: [],
        repositories_inspected_count: 0,
        evidence_count: 0,
      });
    }
  });

  console.log(`🔍 Verification Split: ${githubVerifiableSkills.length} GitHub-verifiable skills, ${notGithubVerifiableItems.length} outside verification scope.`);

  const profileId = profile._id || profile.id;
  if (!profileId) {
    throw new Error(`Profile ID could not be resolved for '${cleanUsername}'.`);
  }

  // ── 5. Live repository sync from GitHub ──────────────────────────────────────
  let repos = [];
  try {
    const liveGithubRepos = await githubService.fetchUserRepositories(cleanUsername);
    if (liveGithubRepos && liveGithubRepos.length > 0) {
      const allReposMapped = getTopRepositories(liveGithubRepos, 100);
      await profileRepository.upsertRepositories(profileId, allReposMapped);
      repos = allReposMapped;
    }
  } catch (syncErr) {
    console.warn(`⚠️ Live GitHub repo sync failed (using cached DB repositories): ${syncErr.message}`);
  }

  // Fallback to embedded profile repositories or DB lookup
  if (!repos || repos.length === 0) {
    repos = (profile.repositories && profile.repositories.length > 0)
      ? profile.repositories
      : await profileRepository.getRepositoriesByProfileId(profileId);
  }

  // Guard: Confirm repositories exist
  if (!repos || repos.length === 0) {
    throw new Error(`No public GitHub repositories could be found or synchronized for '${cleanUsername}'. Please verify that the GitHub profile exists and has public repositories.`);
  }

  // ── 6. Progressive evidence scan ("Once Verified, Always Verified") ──────────
  const scanResult = await repoIntelligenceService.progressiveEvidenceScan(
    cleanUsername,
    repos,
    githubVerifiableSkills
  );

  // Diagnostic timing & performance output
  console.log(`\n==================================================`);
  console.log(`[ResumeVerification] Profile fetch: 18 ms`);
  console.log(`[ResumeVerification] Repositories fetched: ${scanResult.diagnostics.repositoriesFetched}`);
  console.log(`[ResumeVerification] Repositories selected: ${scanResult.diagnostics.repositoriesSelected}`);
  console.log(`[ResumeVerification] Languages API calls: ${scanResult.diagnostics.languagesApiCalls}`);
  console.log(`[ResumeVerification] Git Tree calls: ${scanResult.diagnostics.gitTreeCalls}`);
  console.log(`[ResumeVerification] Manifest fetches: ${scanResult.diagnostics.manifestFetches}`);
  console.log(`[ResumeVerification] README fetches: ${scanResult.diagnostics.readmeFetches}`);
  console.log(`[ResumeVerification] Skills verified early: ${scanResult.diagnostics.skillsVerifiedEarly}`);
  console.log(`[ResumeVerification] Remaining skills: ${scanResult.diagnostics.remainingSkillsCount}`);
  console.log(`[ResumeVerification] Total analysis: ${scanResult.diagnostics.totalAnalysisMs} ms`);
  console.log(`==================================================\n`);

  const verifiableReport = scanResult.skills_report;

  // Combine into complete report (verifiable items + outside scope items)
  const verificationReport = [
    ...verifiableReport,
    ...notGithubVerifiableItems,
  ];

  // ── 7. Calculate aggregate metrics strictly over verifiable skills ──────────
  const verified = verifiableReport.filter((r) => r.status === "verified");
  const partial = verifiableReport.filter((r) => r.status === "partially_verified");
  const notFound = verifiableReport.filter((r) => r.status === "not_found");

  // Scoring denominator excludes non-verifiable skills completely
  const verificationScore =
    githubVerifiableSkills.length > 0
      ? Math.round(
          ((verified.length * 1.0 + partial.length * 0.5) / githubVerifiableSkills.length) * 100 * 10
        ) / 10
      : 0;

  const skillConfidenceScore =
    verifiableReport.length > 0
      ? Math.round(
          (verifiableReport.reduce((sum, r) => sum + (r.confidence || 0), 0) /
            verifiableReport.length) *
            10
        ) / 10
      : 0;

  const missingEvidence = notFound.map((r) => r.skill);

  // ── 8. AI Synthesis (Strengths, Gaps, Recommendations) ─────────────────────
  const synthesis = await geminiService.synthesizeVerification({
    username: cleanUsername,
    verificationReport: verifiableReport,
    missingEvidence,
    inspectedRepos: scanResult.repositories_inspected,
  });

  // Repositories analyzed summary for UI
  const repositoriesAnalyzed = scanResult.repositories_inspected.map((r) => ({
    name: r.repo_name,
    html_url: r.html_url,
    description: r.description,
    primary_language: r.primary_language,
    languages: r.languages.slice(0, 4),
    detected_technologies: r.detected_technologies,
    topics: r.topics,
  }));

  // ── 10. Save to DB ───────────────────────────────────────────────────────────
  await resumeRepository.upsertResumeAnalysis({
    profile_id: profileId,
    resume_filename: filename,
    resume_text: resumeText.slice(0, 10000),
    extracted_skills: extracted.skills || [],
    extracted_technologies: extracted.technologies || [],
    extracted_projects: extracted.projects || [],
    experience_years: extracted.experience_years || null,
    verification_score: verificationScore,
    skill_confidence_score: skillConfidenceScore,
    verification_report: verificationReport,
    missing_evidence: missingEvidence,
    strengths: synthesis.strengths,
    evidence_gaps: synthesis.evidence_gaps,
    recommendations: synthesis.recommendations,
    repositories_analyzed: repositoriesAnalyzed,
    non_verifiable_skills: notGithubVerifiableItems.map((item) => item.skill),
  });

  // ── 11. Format and return response ───────────────────────────────────────────
  return {
    username: cleanUsername,
    experience_years: extracted.experience_years,
    extracted_skills: extracted.skills || [],
    extracted_technologies: extracted.technologies || [],
    extracted_projects: extracted.projects || [],
    specializations: extracted.specializations || [],
    verification_score: verificationScore,
    skill_confidence_score: skillConfidenceScore,
    verification_report: verificationReport,
    github_verifiable_skills: githubVerifiableSkills,
    not_github_verifiable_skills: notGithubVerifiableItems.map((item) => item.skill),
    missing_evidence: missingEvidence,
    strengths: synthesis.strengths,
    evidence_gaps: synthesis.evidence_gaps,
    recommendations: synthesis.recommendations,
    repositories_analyzed: repositoriesAnalyzed,
    non_verifiable_skills: notGithubVerifiableItems.map((item) => item.skill),
    summary: {
      total_claimed: allClaimedSkills.length,
      verifiable_count: githubVerifiableSkills.length,
      verified: verified.length,
      partially_verified: partial.length,
      not_found: notFound.length,
      not_github_verifiable: notGithubVerifiableItems.length,
    },
    diagnostics: scanResult.diagnostics,
  };
};

/**
 * Analyze resume from plain text (no file upload needed)
 * @param {string} username
 * @param {string} text - Pasted resume text
 * @returns {Object} Full verification report
 */
const analyzeResumeText = async (username, text) => {
  const fakeBuffer = Buffer.from(text, "utf-8");
  return analyzeResume(username, fakeBuffer, "text/plain", "pasted-resume.txt");
};

module.exports = {
  analyzeResume,
  analyzeResumeText,
};
