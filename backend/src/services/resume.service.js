/**
 * resume.service.js - Resume Verification Pipeline
 *
 * ORCHESTRATION FLOW:
 * 1. Extract text from PDF/buffer (pdf.service)
 * 2. AI-extract structured skills (gemini.service)
 * 3. Load candidate's GitHub repos from DB (profile.repository)
 * 4. Run evidence matching algorithm (pure logic, no AI cost)
 * 5. Compute verification scores
 * 6. Persist result (resume.repository)
 * 7. Return verification report
 */

const pdfService = require("./pdf.service");
const geminiService = require("./gemini.service");
const profileRepository = require("../repositories/profile.repository");
const resumeRepository = require("../repositories/resume.repository");
const analyzerService = require("./analyzer.service");
const { fetchAllLanguagesForUser, fetchUserRepositories } = require("./github.service");
const { getTopRepositories } = require("../utils/insights");

// ─── Evidence Matching ────────────────────────────────────────────────────────

/**
 * Normalize a skill/language string for fuzzy comparison.
 * Intentionally does NOT strip "js" — "nodejs" and "javascript" are different.
 * "Node.js" → "nodejs", "React.js" → "reactjs", "C++" → "c++"
 */
const normalize = (str) =>
  str.toLowerCase().replace(/[\.\-_\s]/g, "");

/**
 * Ecosystem map: framework/library → parent language(s).
 * If a user claims a framework, we check if their repos heavily use its language.
 */
const ECOSYSTEM_MAP = {
  // JavaScript ecosystem
  react: ["javascript", "typescript", "jsx", "tsx"],
  nextjs: ["javascript", "typescript"],
  vuejs: ["javascript", "typescript"],
  angular: ["typescript", "javascript"],
  svelte: ["javascript", "typescript"],
  nodejs: ["javascript", "typescript"],
  express: ["javascript", "typescript"],
  nestjs: ["typescript", "javascript"],
  gatsby: ["javascript", "typescript"],
  nuxtjs: ["javascript", "typescript"],
  redux: ["javascript", "typescript"],
  graphql: ["javascript", "typescript", "python"],
  // Python ecosystem
  flask: ["python"],
  django: ["python"],
  fastapi: ["python"],
  pandas: ["python"],
  numpy: ["python"],
  pytorch: ["python"],
  tensorflow: ["python"],
  sklearn: ["python"],
  // Java ecosystem
  spring: ["java", "kotlin"],
  springboot: ["java", "kotlin"],
  hibernate: ["java"],
  maven: ["java"],
  gradle: ["java", "kotlin"],
  // DevOps / tools (check description/name)
  docker: ["dockerfile", "yaml", "shell"],
  kubernetes: ["yaml", "shell"],
  aws: [],
  gcp: [],
  azure: [],
  terraform: ["hcl"],
  ansible: ["yaml"],
  // DB — check repo names/descriptions
  mongodb: [],
  postgresql: [],
  mysql: [],
  redis: [],
  sqlite: [],
  // Mobile
  flutter: ["dart"],
  reactnative: ["javascript", "typescript"],
  swift: ["swift"],
  kotlin: ["kotlin"],
};

/**
 * Aliases: alternative spellings that should map to the same normalized skill.
 * Key = normalized input, value = array of alternative normalized forms to also search for.
 */
const SKILL_ALIASES = {
  nodejs: ["node"],
  nextjs: ["next"],
  vuejs: ["vue"],
  reactnative: ["react", "native"],
  expressjs: ["express"],
  reactjs: ["react"],
  express: ["expressjs"],
  html5: ["html"],
  css3: ["css"],
  tailwindcss: ["tailwind"],
  tailwind: ["tailwindcss"],
  socketio: ["socket", "sockets"],
  javaswing: ["swing"],
  recharts: ["chart", "charts", "rechart"],
  scikitlearn: ["sklearn", "scikit"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  javascript: ["js"],
  typescript: ["ts"],
  springboot: ["spring"],
  scikit: ["sklearn", "scikitlearn"],
  machinelearning: ["ml"],
  artificialintelligence: ["ai"],
  git: ["github", "gitlab", "vcs"],
  rest: ["restapi", "restful", "api"],
  graphql: ["gql"],
  cicd: ["ci", "cd", "pipeline", "githubactions"],
  aws: ["amazonwebservices", "s3", "ec2", "lambda"],
  docker: ["dockerfile", "containerization", "containers"],
  kubernetes: ["k8s", "helm"],
};

/**
 * Returns all search terms for a given normalized skill (skill + its aliases)
 */
const getSearchTerms = (normSkill) => {
  const terms = new Set([normSkill]);
  // Add known aliases for this skill
  const aliases = SKILL_ALIASES[normSkill] || [];
  aliases.forEach((a) => terms.add(a));
  // Also check if this skill IS an alias for something else
  Object.entries(SKILL_ALIASES).forEach(([canonical, aliasList]) => {
    if (aliasList.includes(normSkill)) terms.add(canonical);
  });
  return [...terms];
};

/**
 * Word-boundary aware text search supporting short queries and space mappings.
 * @param {string} rawText - Original raw text from name/description
 * @param {string} term - Normalized term to search for
 */
const checkTextForTerm = (rawText, term) => {
  if (!rawText || !term) return false;
  const lowerText = rawText.toLowerCase();
  const normTerm = term.toLowerCase();

  // 1. Standalone word match using regex boundaries
  // This handles single letters and short terms like 'go', 'c', 'js', 'ts' safely!
  const wordRegex = new RegExp(`\\b${normTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  if (wordRegex.test(lowerText)) return true;

  // 2. Normalised space-replaced boundary check (e.g. "react.js" -> "react js" -> word match "react")
  const spaceReplacedText = lowerText.replace(/[\.\-_\s]/g, " ");
  const spaceReplacedTerm = normTerm.replace(/[\.\-_\s]/g, " ");
  const words = spaceReplacedText.split(/\s+/).filter(Boolean);
  
  // Check exact word matches in space-replaced words
  if (words.includes(spaceReplacedTerm)) return true;
  
  // Check if any word in the text starts with the search term (for compound words like "reactnative" or "nextjs")
  for (const word of words) {
    if (word.startsWith(spaceReplacedTerm)) {
      const suffix = word.slice(spaceReplacedTerm.length);
      const KNOWN_SUFFIXES_TO_BLOCK = ["script", "query", "fx"];
      if (!KNOWN_SUFFIXES_TO_BLOCK.some((s) => suffix.startsWith(s))) {
        return true;
      }
    }
  }

  // 3. Compressed fallback matching (handles no-space or custom spelling)
  const compressedText = lowerText.replace(/[\.\-_\s]/g, "");
  const compressedTerm = normTerm.replace(/[\.\-_\s]/g, "");
  if (compressedTerm.length >= 3 && compressedText.includes(compressedTerm)) {
    const idx = compressedText.indexOf(compressedTerm);
    const before = idx > 0 ? compressedText[idx - 1] : null;
    const after = idx + compressedTerm.length < compressedText.length ? compressedText[idx + compressedTerm.length] : null;
    const isWordChar = (c) => c && /[a-z0-9]/.test(c);
    if (isWordChar(before)) return false;
    if (isWordChar(after) && after !== undefined) {
      const suffix = compressedText.slice(idx + compressedTerm.length);
      const KNOWN_SUFFIXES_TO_BLOCK = ["script", "query", "fx"];
      if (KNOWN_SUFFIXES_TO_BLOCK.some((s) => suffix.startsWith(s))) return false;
    }
    return true;
  }

  return false;
};

/**
 * Check how well a single skill is evidenced in GitHub repos.
 * Uses ecosystem-aware matching — frameworks get credit from their parent language.
 *
 * @param {string} skill - Raw skill name from resume
 * @param {Array} repos  - Repo rows from DB
 * @param {Object} languageDistribution - { JavaScript: 12, Python: 4, ... }
 * @returns {{ status, confidence, evidence }}
 */
const matchSkillToRepos = (skill, repos, languageDistribution) => {
  const normSkill = normalize(skill);
  const searchTerms = getSearchTerms(normSkill);
  const evidence = [];
  let confidenceScore = 0;

  // ── 1. Direct repo-level matches ──────────────────────────────────────────
  repos.forEach((repo) => {
    const normPrimaryLang = repo.language ? normalize(repo.language) : "";
    const allLangs = repo.allLanguages || []; // populated by enrichReposWithLanguages

    let repoScore = 0;
    let matched = false;

    for (const term of searchTerms) {
      // Primary language exact match — strongest signal
      if (normPrimaryLang === term) {
        evidence.push(`Primary language in "${repo.repo_name}"`);
        repoScore += 35;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Secondary language match — skill used in this repo (not primary)
      for (const term of searchTerms) {
        if (allLangs.includes(term)) {
          evidence.push(`Used in "${repo.repo_name}" (secondary language)`);
          repoScore += 20;
          break;
        }
      }
    }

    for (const term of searchTerms) {
      // Word-boundary aware name match
      if (checkTextForTerm(repo.repo_name, term)) {
        evidence.push(`Mentioned in repo name: "${repo.repo_name}"`);
        repoScore += 15;
        break;
      }
    }

    for (const term of searchTerms) {
      // Word-boundary aware description match
      if (checkTextForTerm(repo.description, term)) {
        evidence.push(`Mentioned in description of "${repo.repo_name}"`);
        repoScore += 12;
        break;
      }
    }

    confidenceScore += repoScore;
  });

  // ── 2. Language distribution bonus — used in many repos ───────────────────
  for (const term of searchTerms) {
    const langKey = Object.keys(languageDistribution).find(
      (k) => normalize(k) === term
    );
    if (langKey && languageDistribution[langKey] > 0) {
      const bonus = Math.min(25, languageDistribution[langKey] * 6);
      confidenceScore += bonus;
      if (!evidence.find((e) => e.includes("distribution"))) {
        evidence.push(`Used in ${languageDistribution[langKey]} repositories`);
      }
      break;
    }
  }

  // ── 3. Ecosystem inference — framework backed by its parent language ───────
  let ecosystemLanguages = [];
  for (const term of searchTerms) {
    if (ECOSYSTEM_MAP[term] && ECOSYSTEM_MAP[term].length > 0) {
      ecosystemLanguages = ECOSYSTEM_MAP[term];
      break;
    }
  }

  if (ecosystemLanguages.length > 0) {
    let ecosystemRepoCount = 0;
    for (const ecoLang of ecosystemLanguages) {
      // Exact language match in distribution only
      const langKey = Object.keys(languageDistribution).find(
        (k) => normalize(k) === ecoLang
      );
      if (langKey) ecosystemRepoCount += languageDistribution[langKey] || 0;
    }
    if (ecosystemRepoCount > 0) {
      // Framework is plausible when its parent language is heavily used.
      // Cap raised to 80 so that 7+ parent-language repos → verified (>=65%).
      // e.g. 9 JS repos: 10 + 9*8 = 82 → capped 80 → "verified"
      const bonus = Math.min(80, 10 + ecosystemRepoCount * 8);
      confidenceScore += bonus;
      const ecoLangName = ecosystemLanguages[0];
      if (!evidence.find((e) => e.includes("ecosystem"))) {
        evidence.push(
          `Ecosystem: ${ecosystemRepoCount} repos use ${ecoLangName} (${skill}'s language)`
        );
      }
    }
  }

  // ── 4. Cap and classify ────────────────----------------------------
  const confidence = Math.min(100, Math.round(confidenceScore));
  const uniqueEvidence = [...new Set(evidence)].slice(0, 3);

  // Binary classification: evidence exists → verified, none → not_found.
  // "Limited" is removed — if GitHub can detect any proof of the skill, it's verified.
  const status = confidence > 0 ? "verified" : "not_found";

  return { status, confidence, evidence: uniqueEvidence };
};

/**
 * Build a COMPREHENSIVE language distribution from repos + live GitHub language data.
 *
 * Old approach: only counted the primary language per repo.
 * New approach: counts EVERY language used in every repo (byte-weighted).
 *
 * @param {Array}  repos        - Repo rows from DB
 * @param {Object} repoLangMap  - { repoName: { JavaScript: 5000, Python: 2000, ... } }
 * @returns {Object} { language: repoCount } — how many repos use each language
 */
const buildComprehensiveDistribution = (repos, repoLangMap) => {
  const distribution = {};

  repos.forEach((repo) => {
    const name = repo.repo_name;
    const liveLanguages = repoLangMap[name];

    if (liveLanguages && Object.keys(liveLanguages).length > 0) {
      // Use real multi-language data from GitHub API
      Object.keys(liveLanguages).forEach((lang) => {
        distribution[lang] = (distribution[lang] || 0) + 1;
      });
    } else if (repo.language) {
      // Fallback: use primary language from DB if API data missing
      distribution[repo.language] = (distribution[repo.language] || 0) + 1;
    }
  });

  return distribution;
};

/**
 * Build enriched repos array — each repo gains an `allLanguages` field
 * listing ALL languages (not just primary) used in that repo.
 * This is used for direct repo-level skill matching.
 *
 * @param {Array}  repos       - Repo rows from DB
 * @param {Object} repoLangMap - { repoName: { JavaScript: 5000, ... } }
 */
const enrichReposWithLanguages = (repos, repoLangMap) =>
  repos.map((repo) => ({
    ...repo,
    allLanguages: Object.keys(repoLangMap[repo.repo_name] || {}).map((l) => l.toLowerCase()),
  }));

// ─── Main Service Functions ───────────────────────────────────────────────────

/**
 * Full resume analysis pipeline
 * @param {string} username - GitHub username
 * @param {Buffer} fileBuffer - PDF/txt file buffer from multer
 * @param {string} mimetype - File MIME type
 * @param {string} filename - Original filename
 * @returns {Object} Full verification report
 */
const analyzeResume = async (username, fileBuffer, mimetype, filename) => {
  // ── 1. Ensure profile exists in DB ──────────────────────────────────────────
  let profile = await profileRepository.findByUsername(username);
  if (!profile) {
    try {
      const result = await analyzerService.analyzeProfile(username);
      profile = result.profile;
    } catch (err) {
      throw new Error(`Profile for '${username}' could not be analyzed: ${err.message}`);
    }
  }

  // ── 2. Extract text from uploaded file ──────────────────────────────────────
  const resumeText = await pdfService.extractTextFromBuffer(fileBuffer, mimetype);

  // ── 3. AI: extract structured resume data ───────────────────────────────────
  const extracted = await geminiService.extractResumeData(resumeText);

  // Combine skills + technologies into one list for matching
  const allExtracted = [
    ...(extracted.skills || []),
    ...(extracted.technologies || []),
  ].filter(Boolean);

  // ── Filter: remove tools that GitHub cannot verify ──────────────────────────
  // DevOps/cloud/infra tools don't appear as GitHub languages — they'd always
  // show 0% and pollute the score. We exclude them from verification entirely.
  // They are still returned in the response under 'extracted_technologies'.
  const NON_VERIFIABLE_TOOLS = new Set([
    // Version control (all repos use these — not meaningful to verify)
    "git", "github", "gitlab", "bitbucket", "svn",
    // Cloud providers & services
    "aws", "amazon web services", "azure", "gcp", "google cloud",
    "heroku", "vercel", "netlify", "cloudflare", "digitalocean", "render",
    "ec2", "s3", "lambda", "rds", "cloudfront", "sqs", "sns", "ecs", "eks",
    // DevOps & containers
    "docker", "kubernetes", "k8s", "helm", "terraform", "ansible",
    "jenkins", "github actions", "ci/cd", "cicd", "circleci", "travis",
    // Databases — GitHub detects languages, NOT databases used inside code.
    // MySQL inside a Python/JS project won't show in GitHub language stats.
    "mongodb", "mongo", "postgresql", "postgres", "mysql", "sqlite",
    "sql", "nosql", "redis", "cassandra", "dynamodb", "firebase", "supabase",
    "elasticsearch", "oracle", "mariadb", "neo4j", "influxdb",
    // API/Protocol terms
    "rest", "rest apis", "restful", "graphql", "soap", "grpc", "websocket",
    "api", "microservices", "oauth", "jwt",
    // Package managers & build tools (not detectable)
    "npm", "yarn", "pip", "maven", "gradle", "webpack", "vite", "babel",
    // Project management
    "jira", "confluence", "trello", "notion", "slack", "agile", "scrum",
    // OS/networking (not relevant)
    "linux", "unix", "bash", "shell", "powershell", "nginx", "apache",
  ]);

  const normForFilter = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  const allClaimed = allExtracted.filter(
    (skill) => !NON_VERIFIABLE_TOOLS.has(normForFilter(skill))
  );

  const filteredOutTools = allExtracted.filter(
    (skill) => NON_VERIFIABLE_TOOLS.has(normForFilter(skill))
  );

  if (filteredOutTools.length > 0) {
    console.log(`⏭️  Skipping ${filteredOutTools.length} non-verifiable tools: ${filteredOutTools.join(", ")}`);
  }

  // ── 4. Sync repos from GitHub → DB (catches any repos added after first analysis) ──
  // This fixes the bug where only 10 repos were stored (top-10-by-stars).
  // Now we fetch live from GitHub and upsert any missing repos into DB.
  try {
    console.log(`🔄 Syncing repos from GitHub for ${username}...`);
    const liveGithubRepos = await fetchUserRepositories(username);
    const allReposMapped = getTopRepositories(liveGithubRepos, 100); // normalise shape
    await profileRepository.upsertRepositories(profile.id, allReposMapped);
    console.log(`✅ Synced ${allReposMapped.length} repos from GitHub`);
  } catch (syncErr) {
    // Non-fatal: if GitHub is down, continue with what we have in DB
    console.warn(`⚠️ Repo sync failed (using cached DB data): ${syncErr.message}`);
  }

  // ── 4b. Load GitHub repos from DB (now includes newly synced repos) ─────────
  const repos = await profileRepository.getRepositoriesByProfileId(profile.id);
  console.log(`📦 Total repos available for analysis: ${repos.length}`);

  // ── 4c. Fetch FULL per-repo language data from GitHub API ───────────────────
  // This gives us ALL languages in each repo (not just the primary one).
  // e.g. a JS repo also has HTML 15%, CSS 10% — those now count for matching.
  console.log(`🔍 Fetching language breakdown for ${Math.min(repos.length, 30)} repos...`);
  const repoLangMap = await fetchAllLanguagesForUser(username, repos, 30);

  // Build comprehensive language distribution: { JavaScript: 8, Python: 3, CSS: 6, ... }
  const languageDistribution = buildComprehensiveDistribution(repos, repoLangMap);
  console.log(`📊 Languages found across repos:`, Object.keys(languageDistribution).join(", "));

  // Enrich repos with allLanguages for direct per-repo matching
  const enrichedRepos = enrichReposWithLanguages(repos, repoLangMap);

  // ── 5. Run evidence matching using enriched repo data ──────────────────────
  const verificationReport = allClaimed.map((skill) => {
    const match = matchSkillToRepos(skill, enrichedRepos, languageDistribution);
    return {
      skill,
      ...match,
      evidence_count: match.evidence.length,
    };
  });

  // ── 6. Compute scores ────────────────────────────────────────────────────────
  const verified = verificationReport.filter((r) => r.status === "verified");
  const limited = verificationReport.filter((r) => r.status === "limited");
  const notFound = verificationReport.filter((r) => r.status === "not_found");

  const verificationScore =
    allClaimed.length > 0
      ? Math.round(
          ((verified.length * 1.0 + limited.length * 0.5) / allClaimed.length) * 100 * 10
        ) / 10
      : 0;

  const skillConfidenceScore =
    verificationReport.length > 0
      ? Math.round(
          (verificationReport.reduce((sum, r) => sum + r.confidence, 0) /
            verificationReport.length) *
            10
        ) / 10
      : 0;

  const missingEvidence = notFound.map((r) => r.skill);

  // ── 7. Save to DB ────────────────────────────────────────────────────────────
  await resumeRepository.upsertResumeAnalysis({
    profile_id: profile.id,
    resume_filename: filename,
    resume_text: resumeText.slice(0, 10000), // store first 10k chars
    extracted_skills: extracted.skills || [],
    extracted_technologies: extracted.technologies || [],
    extracted_projects: extracted.projects || [],
    experience_years: extracted.experience_years || null,
    verification_score: verificationScore,
    skill_confidence_score: skillConfidenceScore,
    verification_report: verificationReport,
    missing_evidence: missingEvidence,
  });

  return {
    username,
    experience_years: extracted.experience_years,
    extracted_skills: extracted.skills || [],
    extracted_technologies: extracted.technologies || [],
    extracted_projects: extracted.projects || [],
    specializations: extracted.specializations || [],
    verification_score: verificationScore,
    skill_confidence_score: skillConfidenceScore,
    verification_report: verificationReport,
    missing_evidence: missingEvidence,
    summary: {
      total_claimed: allClaimed.length,
      verified: verified.length,
      limited: limited.length,
      not_found: notFound.length,
    },
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

module.exports = { analyzeResume, analyzeResumeText };
