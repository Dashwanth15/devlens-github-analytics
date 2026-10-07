/**
 * repoIntelligence.service.js - Deep Repository Intelligence Engine
 *
 * RESPONSIBILITIES:
 * 1. Select the most relevant 8-12 repositories (recent, star-ranked, skill-matching, diverse).
 * 2. Multi-layer inspection:
 *    - Layer 1: Metadata & Topics
 *    - Layer 2: GitHub Linguist Languages (all detected byte breakdowns)
 *    - Layer 3: Git Tree file structure & extensions (.jsx, .tsx, .py, .html, .css...)
 *    - Layer 4: Manifest parsing (package.json, requirements.txt, Dockerfile...)
 *    - Layer 5: README Tech Stack analysis
 * 3. Structured evidence extraction with deterministic confidence weights
 */

const githubService = require("./github.service");
const {
  CATEGORIES,
  normalizeTechName,
  getTechCategory,
  NPM_PACKAGE_MAP,
  PIP_PACKAGE_MAP,
  EXTENSION_MAP,
  textContainsTech,
  CANONICAL_KEYS,
} = require("../utils/technologyTaxonomy");

// Evidence strength scale
const EVIDENCE_STRENGTH = {
  VERY_STRONG: "VERY_STRONG", // Direct dependency in manifest or explicit Dockerfile
  STRONG:      "STRONG",      // Linguist language detection or multiple dedicated source files
  MEDIUM:      "MEDIUM",      // Repository topic, README section, or supporting extension
  SUPPORTING:  "SUPPORTING",  // Textual mention in name/description
};

/**
 * Select the most relevant 8-12 repositories for deep inspection.
 * Balances:
 * - Direct matches to claimed skills (in name, desc, topics, or language)
 * - Most recently active non-fork projects
 * - Most starred projects
 * - Language diversity
 */
/**
 * Select the most relevant 8-14 repositories for deep inspection.
 * Balances:
 * - Direct matches to claimed skills (in name, desc, topics, or language)
 * - Ecosystem matches (e.g. JS repo for React/Node/Express, Python repo for Flask/Django)
 * - Most recently active non-fork projects
 * - Language and tech stack diversity
 */
const selectRelevantRepositories = (repos = [], claimedSkills = [], maxCount = 14) => {
  if (!Array.isArray(repos) || repos.length === 0) return [];

  // Filter out unoriginal forks unless they have notable stars
  const candidateRepos = repos.filter((r) => !r.is_fork || (r.stars || 0) > 5);
  if (candidateRepos.length <= maxCount) return candidateRepos;

  const normalizedClaims = (claimedSkills || []).map((s) => normalizeTechName(s).toLowerCase());
  const scoredRepos = candidateRepos.map((repo) => {
    let relevanceScore = 0;
    const repoNameLower = (repo.name || repo.repo_name || "").toLowerCase();
    const repoDescLower = (repo.description || "").toLowerCase();
    const topicsLower = (repo.topics || []).map((t) => t.toLowerCase());
    const langLower = (repo.language || "").toLowerCase();

    // Direct claim matches
    normalizedClaims.forEach((claim) => {
      if (langLower === claim) relevanceScore += 70;
      if (repoNameLower.includes(claim)) relevanceScore += 45;
      if (topicsLower.some((t) => t.includes(claim) || claim.includes(t))) relevanceScore += 40;
      if (repoDescLower.includes(claim)) relevanceScore += 30;
    });

    // Ecosystem intelligence matches:
    // If repo is JavaScript/TypeScript, boost for React/Node/Express/Next/Vue/MongoDB claims
    if (langLower === "javascript" || langLower === "typescript") {
      const jsEcosystem = ["react", "node.js", "express", "next.js", "vue", "mongodb", "tailwind css"];
      const matches = jsEcosystem.filter((e) => normalizedClaims.includes(e));
      relevanceScore += matches.length * 20;
    }
    // If repo is Python, boost for Flask/Django/FastAPI/Pandas/Scikit-learn/ML claims
    if (langLower === "python") {
      const pyEcosystem = ["flask", "django", "fastapi", "pandas", "numpy", "scikit-learn", "machine learning"];
      const matches = pyEcosystem.filter((e) => normalizedClaims.includes(e));
      relevanceScore += matches.length * 20;
    }
    // If repo is Java, boost for Java/Spring Boot claims
    if (langLower === "java") {
      relevanceScore += 50;
    }

    // Stars and recency
    const stars = repo.stars || repo.stargazers_count || 0;
    relevanceScore += Math.min(25, stars * 3);

    if (repo.pushed_at) {
      const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePush < 90) relevanceScore += 20;
      else if (daysSincePush < 365) relevanceScore += 10;
    }

    return { repo, score: relevanceScore };
  });

  // Sort descending by score
  scoredRepos.sort((a, b) => b.score - a.score);

  // Guarantee representative repos across distinct languages present in candidate repos
  const selected = [];
  const coveredLangs = new Set();

  for (const item of scoredRepos) {
    const lang = (item.repo.language || "").toLowerCase();
    if (lang && normalizedClaims.includes(lang) && !coveredLangs.has(lang)) {
      selected.push(item.repo);
      coveredLangs.add(lang);
      if (selected.length >= maxCount) break;
    }
  }

  // Fill remaining slots with highest scoring repos
  for (const item of scoredRepos) {
    if (selected.length >= maxCount) break;
    const name = item.repo.name || item.repo.repo_name;
    if (!selected.some((r) => (r.name || r.repo_name) === name)) {
      selected.push(item.repo);
    }
  }

  return selected;
};

/**
 * Parse a package.json content string and extract dependencies
 */
const parsePackageJson = (content) => {
  if (!content) return { dependencies: {}, devDependencies: {}, raw: null };
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return {
      name: parsed.name,
      dependencies: parsed.dependencies || {},
      devDependencies: parsed.devDependencies || {},
      peerDependencies: parsed.peerDependencies || {},
      engines: parsed.engines || {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {}, raw: null };
  }
};

/**
 * Parse a requirements.txt content string and extract pip package names
 */
const parseRequirementsTxt = (content) => {
  if (!content || typeof content !== "string") return [];
  const lines = content.split("\n");
  const packages = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
    // Strip version specifiers like >=, ==, <=, ~=
    const pkgName = trimmed.split(/[=<>~!;@]/)[0].trim().toLowerCase();
    if (pkgName && /^[a-z0-9_\-]+$/i.test(pkgName)) {
      packages.push(pkgName);
    }
  }
  return [...new Set(packages)];
};

/**
 * Perform deep multi-layer inspection on a single repository
 */
const inspectSingleRepository = async (username, repo) => {
  const repoName = repo.name || repo.repo_name;
  const canonicalUrl = repo.html_url || repo.repo_url || `https://github.com/${username}/${repoName}`;
  const defaultBranch = repo.default_branch || "main";

  const intelligence = {
    repo_name: repoName,
    full_name: repo.full_name || `${username}/${repoName}`,
    html_url: canonicalUrl,
    description: repo.description || null,
    primary_language: repo.language || null,
    languages: [],
    file_extensions: [],
    manifests: {},
    topics: repo.topics || [],
    detected_technologies: new Set(),
    evidence_items: [],
  };

  // ── LAYER 1: Full Language Breakdown (GitHub Linguist API) ──────────────────
  try {
    const rawLanguages = await githubService.fetchRepoLanguages(username, repoName);
    intelligence.languages = githubService.normalizeLanguages(rawLanguages);

    intelligence.languages.forEach((lang) => {
      const canonical = normalizeTechName(lang.name);
      intelligence.detected_technologies.add(canonical);
      intelligence.evidence_items.push({
        technology: canonical,
        category: getTechCategory(canonical),
        type: "language",
        source: "GitHub Linguist",
        repository: repoName,
        detail: `${lang.name} (${lang.percentage}% - ${lang.bytes.toLocaleString()} bytes)`,
        strength: lang.percentage > 15 ? EVIDENCE_STRENGTH.VERY_STRONG : EVIDENCE_STRENGTH.STRONG,
        weight: lang.percentage > 15 ? 90 : 75,
      });
    });
  } catch (err) {
    console.warn(`Could not fetch languages for ${repoName}:`, err.message);
  }

  // ── LAYER 2: Topics Analysis ───────────────────────────────────────────────
  if (Array.isArray(repo.topics)) {
    repo.topics.forEach((topic) => {
      const canonical = normalizeTechName(topic);
      if (CANONICAL_KEYS.includes(canonical)) {
        intelligence.detected_technologies.add(canonical);
        intelligence.evidence_items.push({
          technology: canonical,
          category: getTechCategory(canonical),
          type: "topic",
          source: "Repository Topics",
          repository: repoName,
          detail: `Tagged with topic '${topic}'`,
          strength: EVIDENCE_STRENGTH.MEDIUM,
          weight: 70,
        });
      }
    });
  }

  // ── LAYER 3: Git Tree File Inspection ──────────────────────────────────────
  let tree = [];
  try {
    tree = await githubService.fetchRepoTree(username, repoName, defaultBranch);
  } catch (err) {
    console.warn(`Could not fetch tree for ${repoName}:`, err.message);
  }

  const manifestPathsFound = [];
  const extensionCounts = {};

  if (Array.isArray(tree) && tree.length > 0) {
    tree.forEach((node) => {
      if (node.type !== "blob") return;
      const path = node.path || "";
      const pathLower = path.toLowerCase();

      // Collect file extensions
      const extMatch = pathLower.match(/\.([a-z0-9]+)$/);
      if (extMatch) {
        const ext = `.${extMatch[1]}`;
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      }

      // Check for known manifests and configurations
      if (
        pathLower === "package.json" ||
        pathLower.endsWith("/package.json") ||
        pathLower === "requirements.txt" ||
        pathLower.endsWith("/requirements.txt") ||
        pathLower === "dockerfile" ||
        pathLower.endsWith("/dockerfile") ||
        pathLower.includes("dockerfile.") ||
        pathLower.endsWith("docker-compose.yml") ||
        pathLower.endsWith("docker-compose.yaml") ||
        pathLower === ".dockerignore" ||
        pathLower.endsWith("/.dockerignore") ||
        pathLower.startsWith("k8s/") ||
        pathLower.startsWith("kubernetes/") ||
        pathLower.includes("deploy/") ||
        pathLower.endsWith("k8s.yaml") ||
        pathLower.endsWith("k8s.yml") ||
        pathLower === "chart.yaml" ||
        pathLower === "pom.xml" ||
        pathLower.endsWith("/pom.xml") ||
        pathLower === "build.gradle" ||
        pathLower.endsWith("/build.gradle") ||
        pathLower === "go.mod" ||
        pathLower === "cargo.toml" ||
        pathLower === ".gitignore" ||
        pathLower.endsWith("/.gitignore") ||
        pathLower.startsWith(".github/workflows/")
      ) {
        manifestPathsFound.push(path);
      }
    });

    intelligence.file_extensions = Object.keys(extensionCounts);

    // Map extensions to technology signals (supports multi-tech extensions like .tsx -> TypeScript + React)
    Object.entries(extensionCounts).forEach(([ext, count]) => {
      const techs = EXTENSION_MAP[ext];
      if (Array.isArray(techs)) {
        techs.forEach((tech) => {
          intelligence.detected_technologies.add(tech);
          intelligence.evidence_items.push({
            technology: tech,
            category: getTechCategory(tech),
            type: "file_extension",
            source: "File Tree",
            repository: repoName,
            detail: `${count} file${count === 1 ? "" : "s"} with ${ext} extension`,
            strength: count >= 3 ? EVIDENCE_STRENGTH.STRONG : EVIDENCE_STRENGTH.MEDIUM,
            weight: count >= 3 ? 75 : 60,
          });
        });
      }
    });
  } else {
    // Fallback if Git Tree API is unavailable or rate-limited: probe common files directly
    const commonProbes = [
      "package.json", "client/package.json", "server/package.json", "frontend/package.json", "backend/package.json",
      "requirements.txt", "Dockerfile", "docker-compose.yml", ".gitignore"
    ];
    for (const probePath of commonProbes) {
      try {
        const content = await githubService.fetchRawFileContent(username, repoName, probePath, defaultBranch);
        if (content) {
          manifestPathsFound.push(probePath);
        }
      } catch {
        // Ignore probe failure
      }
    }
  }

  // ── LAYER 4: Manifest Parsing ──────────────────────────────────────────────
  // Fetch up to 4 package.json files (root, client, server, backend, frontend)
  const packageJsonPaths = manifestPathsFound.filter((p) => p.toLowerCase().endsWith("package.json")).slice(0, 4);
  for (const pkgPath of packageJsonPaths) {
    const content = await githubService.fetchRawFileContent(username, repoName, pkgPath, defaultBranch);
    if (content) {
      const parsed = parsePackageJson(content);
      intelligence.manifests[pkgPath] = { dependencies: Object.keys(parsed.dependencies) };

      // Node.js runtime evidence
      intelligence.detected_technologies.add("Node.js");
      intelligence.evidence_items.push({
        technology: "Node.js",
        category: CATEGORIES.RUNTIME,
        type: "manifest",
        source: pkgPath,
        repository: repoName,
        detail: `Node.js project manifest (${pkgPath})`,
        strength: EVIDENCE_STRENGTH.STRONG,
        weight: 85,
      });

      const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };
      Object.keys(allDeps).forEach((depName) => {
        const canonical = NPM_PACKAGE_MAP[depName.toLowerCase()];
        if (canonical) {
          const version = allDeps[depName];
          intelligence.detected_technologies.add(canonical);
          intelligence.evidence_items.push({
            technology: canonical,
            category: getTechCategory(canonical),
            type: "dependency",
            source: pkgPath,
            repository: repoName,
            detail: `${depName}@${version}`,
            strength: EVIDENCE_STRENGTH.VERY_STRONG,
            weight: 95,
          });
        }
      });
    }
  }

  // Check Python requirements.txt
  const reqPaths = manifestPathsFound.filter((p) => p.toLowerCase().endsWith("requirements.txt")).slice(0, 3);
  for (const reqPath of reqPaths) {
    const content = await githubService.fetchRawFileContent(username, repoName, reqPath, defaultBranch);
    if (content) {
      const packages = parseRequirementsTxt(content);
      intelligence.manifests[reqPath] = { packages };

      // Python language evidence
      intelligence.detected_technologies.add("Python");
      intelligence.evidence_items.push({
        technology: "Python",
        category: CATEGORIES.LANGUAGE,
        type: "manifest",
        source: reqPath,
        repository: repoName,
        detail: `Python dependency manifest (${reqPath})`,
        strength: EVIDENCE_STRENGTH.STRONG,
        weight: 85,
      });

      packages.forEach((pkg) => {
        const canonical = PIP_PACKAGE_MAP[pkg];
        if (canonical) {
          intelligence.detected_technologies.add(canonical);
          intelligence.evidence_items.push({
            technology: canonical,
            category: getTechCategory(canonical),
            type: "dependency",
            source: reqPath,
            repository: repoName,
            detail: `Python package: ${pkg}`,
            strength: EVIDENCE_STRENGTH.VERY_STRONG,
            weight: 95,
          });
        }
      });
    }
  }

  // Check Docker
  const dockerPaths = manifestPathsFound.filter((p) => {
    const l = p.toLowerCase();
    return l.includes("dockerfile") || l.includes("docker-compose") || l.includes(".dockerignore");
  });
  if (dockerPaths.length > 0) {
    intelligence.detected_technologies.add("Docker");
    intelligence.evidence_items.push({
      technology: "Docker",
      category: CATEGORIES.DEVOPS_CONTAINER,
      type: "configuration",
      source: dockerPaths[0],
      repository: repoName,
      detail: `Container configuration detected: ${dockerPaths.slice(0, 2).join(", ")}`,
      strength: EVIDENCE_STRENGTH.VERY_STRONG,
      weight: 95,
    });
  }

  // Check Kubernetes
  const k8sPaths = manifestPathsFound.filter((p) => {
    const l = p.toLowerCase();
    return l.startsWith("k8s/") || l.startsWith("kubernetes/") || l.includes("deploy/") || l.endsWith("k8s.yaml") || l.endsWith("k8s.yml") || l === "chart.yaml";
  });
  if (k8sPaths.length > 0) {
    intelligence.detected_technologies.add("Kubernetes");
    intelligence.evidence_items.push({
      technology: "Kubernetes",
      category: CATEGORIES.DEVOPS_CONTAINER,
      type: "configuration",
      source: k8sPaths[0],
      repository: repoName,
      detail: `Kubernetes deployment manifests detected: ${k8sPaths.slice(0, 2).join(", ")}`,
      strength: EVIDENCE_STRENGTH.VERY_STRONG,
      weight: 95,
    });
  }

  // Check Git & CI/CD
  const gitPaths = manifestPathsFound.filter((p) => p.toLowerCase() === ".gitignore" || p.toLowerCase().endsWith("/.gitignore"));
  if (gitPaths.length > 0) {
    intelligence.detected_technologies.add("Git");
    intelligence.evidence_items.push({
      technology: "Git",
      category: CATEGORIES.BUILD_TOOL,
      type: "configuration",
      source: gitPaths[0],
      repository: repoName,
      detail: `Git version control configuration (.gitignore)`,
      strength: EVIDENCE_STRENGTH.STRONG,
      weight: 80,
    });
  }

  const cicdPaths = manifestPathsFound.filter((p) => p.toLowerCase().startsWith(".github/workflows/"));
  if (cicdPaths.length > 0) {
    intelligence.detected_technologies.add("CI/CD");
    intelligence.detected_technologies.add("GitHub Actions");
    intelligence.evidence_items.push({
      technology: "CI/CD",
      category: CATEGORIES.DEVOPS_CONTAINER,
      type: "configuration",
      source: cicdPaths[0],
      repository: repoName,
      detail: `GitHub Actions CI/CD workflows (${cicdPaths.length} workflow file${cicdPaths.length === 1 ? "" : "s"})`,
      strength: EVIDENCE_STRENGTH.VERY_STRONG,
      weight: 90,
    });
  }

  // ── LAYER 5: README & Project Documentation Analysis ───────────────────────
  try {
    const readmeContent = await githubService.fetchRepoReadme(username, repoName);
    if (readmeContent && typeof readmeContent === "string" && readmeContent.length > 30) {
      CANONICAL_KEYS.forEach((canonical) => {
        if (textContainsTech(readmeContent, canonical)) {
          intelligence.detected_technologies.add(canonical);
          intelligence.evidence_items.push({
            technology: canonical,
            category: getTechCategory(canonical),
            type: "documentation",
            source: "README.md",
            repository: repoName,
            detail: `Documented in README / project tech stack specifications`,
            strength: EVIDENCE_STRENGTH.MEDIUM,
            weight: 65,
          });
        }
      });
    }
  } catch (err) {
    // Non-fatal if README fetch fails
  }

  // ── LAYER 6: Description & Metadata Mentions ───────────────────────────────
  if (repo.description) {
    CANONICAL_KEYS.forEach((canonical) => {
      if (textContainsTech(repo.description, canonical)) {
        intelligence.detected_technologies.add(canonical);
        intelligence.evidence_items.push({
          technology: canonical,
          category: getTechCategory(canonical),
          type: "metadata",
          source: "Repository Description",
          repository: repoName,
          detail: `Mentioned in description: "${repo.description.slice(0, 100)}"`,
          strength: EVIDENCE_STRENGTH.SUPPORTING,
          weight: 45,
        });
      }
    });
  }

  // Convert Set to Array
  intelligence.detected_technologies = Array.from(intelligence.detected_technologies);
  return intelligence;
};

/**
 * Progressive Evidence Scanner ("Once Verified, Always Verified")
 * 
 * Rules:
 * 1. For each GitHub-verifiable skill, track verification state (pending, verified, partially_verified, not_found).
 * 2. Progressively scan candidate repositories from cheapest signals to deepest signals:
 *    - Level 1: Repository metadata (primary language, topics, description, name)
 *    - Level 2: GitHub Linguist Languages API (byte breakdowns)
 *    - Level 3: Git Tree file structure & source extensions (.jsx, .tsx, .py, .java, .html, .css...)
 *    - Level 4: Configuration files (Dockerfiles, Kubernetes manifests, .gitignore, CI/CD workflows)
 *    - Level 5: Dependency manifests (package.json, requirements.txt, etc.)
 *    - Level 6: README documentation (only when stronger evidence is missing)
 * 3. ONCE STRONG EVIDENCE IS FOUND:
 *    - Mark skill as VERIFIED.
 *    - Remove skill from remaining pending skills!
 * 4. EARLY EXIT:
 *    - If remainingSkills.size === 0 -> Immediately terminate repository search.
 * 5. Track diagnostic stats and repository inspection count per skill.
 */
const progressiveEvidenceScan = async (username, repos = [], verifiableSkills = []) => {
  const startTime = Date.now();

  const normalizedVerifiable = verifiableSkills.map((s) => normalizeTechName(s));
  const skillStates = {};
  normalizedVerifiable.forEach((skill) => {
    skillStates[skill] = {
      skill,
      category: getTechCategory(skill),
      status: "pending",
      confidence: 0,
      evidence: [],
      evidence_items: [],
      supporting_repos: new Set(),
      repositories_inspected_count: 0,
      reasoning: "",
    };
  });

  const remainingSkills = new Set(normalizedVerifiable);
  const selectedRepos = selectRelevantRepositories(repos, normalizedVerifiable, 15);

  const diagnostics = {
    repositoriesFetched: repos.length,
    repositoriesSelected: selectedRepos.length,
    repositoriesInspected: 0,
    languagesApiCalls: 0,
    gitTreeCalls: 0,
    manifestFetches: 0,
    readmeFetches: 0,
    skillsVerifiedEarly: 0,
    remainingSkillsCount: remainingSkills.size,
    totalAnalysisMs: 0,
  };

  const inspectedReposSummary = [];
  const unifiedEvidenceMap = {};

  const addEvidence = (canonicalTech, repoName, evItem) => {
    const canonical = normalizeTechName(canonicalTech);
    if (!skillStates[canonical]) return;

    const state = skillStates[canonical];
    state.supporting_repos.add(repoName);
    state.evidence_items.push(evItem);
    state.evidence.push(`${evItem.source}: ${evItem.detail} [${repoName}]`);

    if (!unifiedEvidenceMap[canonical]) {
      unifiedEvidenceMap[canonical] = [];
    }
    unifiedEvidenceMap[canonical].push(evItem);

    const maxWeight = Math.max(...state.evidence_items.map((e) => e.weight || 50));
    const repoBonus = Math.min(15, (state.supporting_repos.size - 1) * 6);
    state.confidence = Math.min(100, maxWeight + repoBonus);

    if (state.confidence >= 60 && remainingSkills.has(canonical)) {
      state.status = "verified";
      state.reasoning = `Meaningful evidence confirmed via ${evItem.source} in ${Array.from(state.supporting_repos).slice(0, 3).join(", ")}.`;
      remainingSkills.delete(canonical);
      diagnostics.skillsVerifiedEarly++;
    }
  };

  for (let rIdx = 0; rIdx < selectedRepos.length; rIdx++) {
    if (remainingSkills.size === 0) {
      console.log(`⚡ [ResumeVerification] All ${normalizedVerifiable.length} skills verified early after inspecting ${rIdx} repositories! Stopping scan.`);
      break;
    }

    const repo = selectedRepos[rIdx];
    const repoName = repo.name || repo.repo_name;
    const defaultBranch = repo.default_branch || "main";
    diagnostics.repositoriesInspected++;

    remainingSkills.forEach((skill) => {
      skillStates[skill].repositories_inspected_count = diagnostics.repositoriesInspected;
    });

    const repoIntel = {
      repo_name: repoName,
      html_url: repo.html_url || repo.repo_url || `https://github.com/${username}/${repoName}`,
      description: repo.description,
      primary_language: repo.language,
      languages: [],
      detected_technologies: new Set(),
      topics: repo.topics || [],
    };

    // ── LEVEL 1: REPOSITORY METADATA ──────────────────────────────────────────
    if (repo.language) {
      const canonicalLang = normalizeTechName(repo.language);
      if (remainingSkills.has(canonicalLang)) {
        addEvidence(canonicalLang, repoName, {
          technology: canonicalLang,
          category: getTechCategory(canonicalLang),
          type: "language",
          source: "Primary Language",
          repository: repoName,
          detail: `Primary repository language: ${repo.language}`,
          strength: EVIDENCE_STRENGTH.STRONG,
          weight: 90,
        });
        repoIntel.detected_technologies.add(canonicalLang);
      }
    }

    if (Array.isArray(repo.topics)) {
      repo.topics.forEach((topic) => {
        const canonicalTopic = normalizeTechName(topic);
        if (remainingSkills.has(canonicalTopic)) {
          addEvidence(canonicalTopic, repoName, {
            technology: canonicalTopic,
            category: getTechCategory(canonicalTopic),
            type: "topic",
            source: "Repository Topics",
            repository: repoName,
            detail: `Tagged with repository topic '${topic}'`,
            strength: EVIDENCE_STRENGTH.MEDIUM,
            weight: 70,
          });
          repoIntel.detected_technologies.add(canonicalTopic);
        }
      });
    }

    if (remainingSkills.size === 0) {
      repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
      inspectedReposSummary.push(repoIntel);
      break;
    }

    // ── LEVEL 2: GITHUB LANGUAGES API ─────────────────────────────────────────
    try {
      diagnostics.languagesApiCalls++;
      const rawLanguages = await githubService.fetchRepoLanguages(username, repoName);
      const normalizedLangs = githubService.normalizeLanguages(rawLanguages);
      repoIntel.languages = normalizedLangs;

      normalizedLangs.forEach((lang) => {
        const canonical = normalizeTechName(lang.name);
        repoIntel.detected_technologies.add(canonical);
        if (remainingSkills.has(canonical)) {
          addEvidence(canonical, repoName, {
            technology: canonical,
            category: getTechCategory(canonical),
            type: "language",
            source: "GitHub Linguist",
            repository: repoName,
            detail: `${lang.name} (${lang.percentage}% - ${lang.bytes.toLocaleString()} bytes)`,
            strength: lang.percentage > 15 ? EVIDENCE_STRENGTH.VERY_STRONG : EVIDENCE_STRENGTH.STRONG,
            weight: lang.percentage > 15 ? 95 : 85,
          });
        }
      });
    } catch (err) {
      console.warn(`Could not fetch languages for ${repoName}:`, err.message);
    }

    if (remainingSkills.size === 0) {
      repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
      inspectedReposSummary.push(repoIntel);
      break;
    }

    // ── LEVEL 3: GIT TREE FILE INSPECTION ─────────────────────────────────────
    let tree = [];
    try {
      diagnostics.gitTreeCalls++;
      tree = await githubService.fetchRepoTree(username, repoName, defaultBranch);
    } catch (err) {
      console.warn(`Could not fetch tree for ${repoName}:`, err.message);
    }

    const manifestPathsFound = [];
    const extensionCounts = {};

    if (Array.isArray(tree) && tree.length > 0) {
      tree.forEach((node) => {
        if (node.type !== "blob") return;
        const path = node.path || "";
        const pathLower = path.toLowerCase();

        const extMatch = pathLower.match(/\.([a-z0-9]+)$/);
        if (extMatch) {
          const ext = `.${extMatch[1]}`;
          extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
        }

        if (
          pathLower === "package.json" ||
          pathLower.endsWith("/package.json") ||
          pathLower === "requirements.txt" ||
          pathLower.endsWith("/requirements.txt") ||
          pathLower === "pyproject.toml" ||
          pathLower === "dockerfile" ||
          pathLower.endsWith("/dockerfile") ||
          pathLower.includes("dockerfile.") ||
          pathLower.endsWith("docker-compose.yml") ||
          pathLower.endsWith("docker-compose.yaml") ||
          pathLower === ".dockerignore" ||
          pathLower.endsWith("/.dockerignore") ||
          pathLower.startsWith("k8s/") ||
          pathLower.startsWith("kubernetes/") ||
          pathLower.includes("deploy/") ||
          pathLower.endsWith("k8s.yaml") ||
          pathLower.endsWith("k8s.yml") ||
          pathLower === "chart.yaml" ||
          pathLower === "pom.xml" ||
          pathLower.endsWith("/pom.xml") ||
          pathLower === "build.gradle" ||
          pathLower.endsWith("/build.gradle") ||
          pathLower === "go.mod" ||
          pathLower === "cargo.toml" ||
          pathLower === ".gitignore" ||
          pathLower.endsWith("/.gitignore") ||
          pathLower.startsWith(".github/workflows/")
        ) {
          manifestPathsFound.push(path);
        }
      });

      Object.entries(extensionCounts).forEach(([ext, count]) => {
        const techs = EXTENSION_MAP[ext];
        if (Array.isArray(techs)) {
          techs.forEach((tech) => {
            repoIntel.detected_technologies.add(tech);
            if (remainingSkills.has(tech)) {
              addEvidence(tech, repoName, {
                technology: tech,
                category: getTechCategory(tech),
                type: "file_extension",
                source: "File Tree",
                repository: repoName,
                detail: `${count} file${count === 1 ? "" : "s"} with ${ext} extension`,
                strength: count >= 3 ? EVIDENCE_STRENGTH.STRONG : EVIDENCE_STRENGTH.MEDIUM,
                weight: count >= 3 ? 90 : 75,
              });
            }
          });
        }
      });
    } else {
      const commonProbes = ["package.json", "client/package.json", "server/package.json", "requirements.txt", "Dockerfile", ".gitignore"];
      for (const probePath of commonProbes) {
        try {
          const content = await githubService.fetchRawFileContent(username, repoName, probePath, defaultBranch);
          if (content) manifestPathsFound.push(probePath);
        } catch {}
      }
    }

    if (remainingSkills.size === 0) {
      repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
      inspectedReposSummary.push(repoIntel);
      break;
    }

    // ── LEVEL 4: CONFIGURATION FILES ──────────────────────────────────────────
    if (remainingSkills.has("Docker")) {
      const dockerPaths = manifestPathsFound.filter((p) => {
        const l = p.toLowerCase();
        return l.includes("dockerfile") || l.includes("docker-compose") || l.includes(".dockerignore");
      });
      if (dockerPaths.length > 0) {
        addEvidence("Docker", repoName, {
          technology: "Docker",
          category: CATEGORIES.DEVOPS_CONTAINER,
          type: "configuration",
          source: dockerPaths[0],
          repository: repoName,
          detail: `Container configuration detected: ${dockerPaths.slice(0, 2).join(", ")}`,
          strength: EVIDENCE_STRENGTH.VERY_STRONG,
          weight: 95,
        });
        repoIntel.detected_technologies.add("Docker");
      }
    }

    if (remainingSkills.has("Kubernetes")) {
      const k8sPaths = manifestPathsFound.filter((p) => {
        const l = p.toLowerCase();
        return l.startsWith("k8s/") || l.startsWith("kubernetes/") || l.includes("deploy/") || l.endsWith("k8s.yaml") || l.endsWith("k8s.yml") || l === "chart.yaml";
      });
      if (k8sPaths.length > 0) {
        addEvidence("Kubernetes", repoName, {
          technology: "Kubernetes",
          category: CATEGORIES.DEVOPS_CONTAINER,
          type: "configuration",
          source: k8sPaths[0],
          repository: repoName,
          detail: `Kubernetes deployment manifests detected: ${k8sPaths.slice(0, 2).join(", ")}`,
          strength: EVIDENCE_STRENGTH.VERY_STRONG,
          weight: 95,
        });
        repoIntel.detected_technologies.add("Kubernetes");
      }
    }

    if (remainingSkills.has("Git")) {
      const gitPaths = manifestPathsFound.filter((p) => p.toLowerCase() === ".gitignore" || p.toLowerCase().endsWith("/.gitignore"));
      if (gitPaths.length > 0) {
        addEvidence("Git", repoName, {
          technology: "Git",
          category: CATEGORIES.BUILD_TOOL,
          type: "configuration",
          source: gitPaths[0],
          repository: repoName,
          detail: `Git version control configuration (.gitignore)`,
          strength: EVIDENCE_STRENGTH.STRONG,
          weight: 90,
        });
        repoIntel.detected_technologies.add("Git");
      }
    }

    if (remainingSkills.has("CI/CD") || remainingSkills.has("GitHub Actions")) {
      const cicdPaths = manifestPathsFound.filter((p) => p.toLowerCase().startsWith(".github/workflows/"));
      if (cicdPaths.length > 0) {
        const detail = `GitHub Actions CI/CD workflows (${cicdPaths.length} workflow file${cicdPaths.length === 1 ? "" : "s"})`;
        if (remainingSkills.has("CI/CD")) {
          addEvidence("CI/CD", repoName, {
            technology: "CI/CD",
            category: CATEGORIES.DEVOPS_CONTAINER,
            type: "configuration",
            source: cicdPaths[0],
            repository: repoName,
            detail,
            strength: EVIDENCE_STRENGTH.VERY_STRONG,
            weight: 90,
          });
        }
        if (remainingSkills.has("GitHub Actions")) {
          addEvidence("GitHub Actions", repoName, {
            technology: "GitHub Actions",
            category: CATEGORIES.DEVOPS_CONTAINER,
            type: "configuration",
            source: cicdPaths[0],
            repository: repoName,
            detail,
            strength: EVIDENCE_STRENGTH.VERY_STRONG,
            weight: 90,
          });
        }
        repoIntel.detected_technologies.add("CI/CD");
      }
    }

    if (remainingSkills.size === 0) {
      repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
      inspectedReposSummary.push(repoIntel);
      break;
    }

    // ── LEVEL 5: MANIFEST PARSING ─────────────────────────────────────────────
    const packageJsonPaths = manifestPathsFound.filter((p) => p.toLowerCase().endsWith("package.json")).slice(0, 4);
    if (packageJsonPaths.length > 0) {
      for (const pkgPath of packageJsonPaths) {
        diagnostics.manifestFetches++;
        const content = await githubService.fetchRawFileContent(username, repoName, pkgPath, defaultBranch);
        if (content) {
          const parsed = parsePackageJson(content);
          if (remainingSkills.has("Node.js")) {
            addEvidence("Node.js", repoName, {
              technology: "Node.js",
              category: CATEGORIES.RUNTIME,
              type: "manifest",
              source: pkgPath,
              repository: repoName,
              detail: `Node.js project manifest (${pkgPath})`,
              strength: EVIDENCE_STRENGTH.STRONG,
              weight: 95,
            });
            repoIntel.detected_technologies.add("Node.js");
          }

          const allDeps = { ...parsed.dependencies, ...parsed.devDependencies };
          Object.keys(allDeps).forEach((depName) => {
            const canonical = NPM_PACKAGE_MAP[depName.toLowerCase()];
            if (canonical) {
              repoIntel.detected_technologies.add(canonical);
              if (remainingSkills.has(canonical)) {
                const version = allDeps[depName];
                addEvidence(canonical, repoName, {
                  technology: canonical,
                  category: getTechCategory(canonical),
                  type: "dependency",
                  source: pkgPath,
                  repository: repoName,
                  detail: `${depName}@${version}`,
                  strength: EVIDENCE_STRENGTH.VERY_STRONG,
                  weight: 100,
                });
              }
            }
          });
        }
      }
    }

    const reqPaths = manifestPathsFound.filter((p) => p.toLowerCase().endsWith("requirements.txt")).slice(0, 3);
    if (reqPaths.length > 0) {
      for (const reqPath of reqPaths) {
        diagnostics.manifestFetches++;
        const content = await githubService.fetchRawFileContent(username, repoName, reqPath, defaultBranch);
        if (content) {
          const packages = parseRequirementsTxt(content);
          if (remainingSkills.has("Python")) {
            addEvidence("Python", repoName, {
              technology: "Python",
              category: CATEGORIES.LANGUAGE,
              type: "manifest",
              source: reqPath,
              repository: repoName,
              detail: `Python dependency manifest (${reqPath})`,
              strength: EVIDENCE_STRENGTH.STRONG,
              weight: 95,
            });
            repoIntel.detected_technologies.add("Python");
          }

          packages.forEach((pkg) => {
            const canonical = PIP_PACKAGE_MAP[pkg];
            if (canonical) {
              repoIntel.detected_technologies.add(canonical);
              if (remainingSkills.has(canonical)) {
                addEvidence(canonical, repoName, {
                  technology: canonical,
                  category: getTechCategory(canonical),
                  type: "dependency",
                  source: reqPath,
                  repository: repoName,
                  detail: `Python package: ${pkg}`,
                  strength: EVIDENCE_STRENGTH.VERY_STRONG,
                  weight: 100,
                });
              }
            }
          });
        }
      }
    }

    if (remainingSkills.size === 0) {
      repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
      inspectedReposSummary.push(repoIntel);
      break;
    }

    // ── LEVEL 6: README DOCUMENTATION ─────────────────────────────────────────
    if (remainingSkills.size > 0) {
      try {
        diagnostics.readmeFetches++;
        const readmeContent = await githubService.fetchRepoReadme(username, repoName);
        if (readmeContent && typeof readmeContent === "string" && readmeContent.length > 30) {
          remainingSkills.forEach((canonical) => {
            if (textContainsTech(readmeContent, canonical)) {
              addEvidence(canonical, repoName, {
                technology: canonical,
                category: getTechCategory(canonical),
                type: "documentation",
                source: "README.md",
                repository: repoName,
                detail: `Documented in README / project tech stack specifications`,
                strength: EVIDENCE_STRENGTH.MEDIUM,
                weight: 65,
              });
              repoIntel.detected_technologies.add(canonical);
            }
          });
        }
      } catch {}
    }

    repoIntel.detected_technologies = Array.from(repoIntel.detected_technologies);
    inspectedReposSummary.push(repoIntel);
  }

  // Final status assignment for any skills unresolved after scanning candidate repos
  normalizedVerifiable.forEach((skill) => {
    const state = skillStates[skill];
    if (state.status === "pending") {
      if (state.confidence >= 60) {
        state.status = "verified";
      } else if (state.confidence >= 25) {
        state.status = "partially_verified";
        state.reasoning = `Supporting evidence found in ${Array.from(state.supporting_repos).join(", ")}, but no direct production dependency or source files were confirmed.`;
      } else {
        state.status = "not_found";
        state.confidence = 0;
        state.reasoning = `No sufficient public GitHub evidence was found across ${diagnostics.repositoriesInspected} inspected repositories.`;
      }
    }
    state.supporting_repos = Array.from(state.supporting_repos);
  });

  diagnostics.remainingSkillsCount = remainingSkills.size;
  diagnostics.totalAnalysisMs = Date.now() - startTime;

  return {
    username,
    skills_report: Object.values(skillStates),
    repositories_inspected: inspectedReposSummary,
    diagnostics,
    evidence_map: unifiedEvidenceMap,
  };
};

/**
 * Backward compatibility wrapper
 */
const inspectCandidateRepositories = async (username, repos = [], claimedSkills = []) => {
  const scanResult = await progressiveEvidenceScan(username, repos, claimedSkills);
  return {
    username,
    repositories_inspected: scanResult.repositories_inspected,
    evidence_map: scanResult.evidence_map,
    all_detected_technologies: Object.keys(scanResult.evidence_map),
    diagnostics: scanResult.diagnostics,
    skills_report: scanResult.skills_report,
  };
};

module.exports = {
  EVIDENCE_STRENGTH,
  selectRelevantRepositories,
  inspectSingleRepository,
  inspectCandidateRepositories,
  progressiveEvidenceScan,
};
