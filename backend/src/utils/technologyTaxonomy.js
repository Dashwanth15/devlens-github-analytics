/**
 * technologyTaxonomy.js - Comprehensive Technology Dictionary, Classification & Verification Eligibility
 *
 * Provides:
 * - 3-Tier Classification Model:
 *   1. GITHUB VERIFIABLE: Programming languages, frameworks, libraries, runtimes, databases, containers/DevOps, build tools.
 *   2. NOT GITHUB VERIFIABLE (Outside Scope): Cloud platforms, auth/network protocols, architecture paradigms, soft/professional skills.
 * - Normalized taxonomy of 250+ technical and professional skills
 * - Exact canonical names, aliases, and synonym resolution
 * - Manifest package mappings (npm, pip, maven) and file extension signals
 * - Word-boundary regex matching preventing false positives (e.g. "Java" vs "JavaScript")
 */

const CATEGORIES = {
  // ── GitHub Verifiable Categories ───────────────────────────────────────────
  LANGUAGE:          "Programming Language",
  FRAMEWORK:         "Framework",
  LIBRARY:           "Library",
  RUNTIME:           "Runtime",
  DATABASE:          "Database",
  DEVOPS_CONTAINER:  "DevOps & Container",
  BUILD_TOOL:        "Tool & Build Tool",
  DATA_AI:           "AI & Data Science",

  // ── Outside GitHub Verification Scope Categories ───────────────────────────
  CLOUD_PLATFORM:    "Cloud Platform",
  AUTH_PROTOCOL:     "Protocol & Authentication",
  ARCHITECTURE:      "Architecture & Concept",
  PROFESSIONAL:      "Professional & Soft Skill",
  CERTIFICATION:     "Certification",
};

// Category eligibility metadata
const CATEGORY_ELIGIBILITY = {
  [CATEGORIES.LANGUAGE]:         { verifiable: true,  description: "Programming languages detected via Linguist and source files" },
  [CATEGORIES.FRAMEWORK]:        { verifiable: true,  description: "Web and application frameworks verified via package manifests and files" },
  [CATEGORIES.LIBRARY]:          { verifiable: true,  description: "Libraries and utilities verified via package manifests" },
  [CATEGORIES.RUNTIME]:          { verifiable: true,  description: "Runtime environments verified via manifests and project configurations" },
  [CATEGORIES.DATABASE]:         { verifiable: true,  description: "Databases verified via drivers, ORMs, schemas, and configurations" },
  [CATEGORIES.DEVOPS_CONTAINER]: { verifiable: true,  description: "Containerization and infrastructure as code verified via config files" },
  [CATEGORIES.BUILD_TOOL]:       { verifiable: true,  description: "Build tools and bundlers verified via repository configuration" },
  [CATEGORIES.DATA_AI]:          { verifiable: true,  description: "Data science and ML packages verified via dependency manifests" },

  [CATEGORIES.CLOUD_PLATFORM]: {
    verifiable: false,
    reason: "Cloud platform proficiency (AWS, Azure, GCP...) cannot be reliably verified from public repository code alone without live cloud account infrastructure access.",
  },
  [CATEGORIES.AUTH_PROTOCOL]: {
    verifiable: false,
    reason: "Protocols and token techniques (JWT, OAuth, AJAX, REST...) represent architectural patterns and helper methods whose presence in code does not establish professional security or design proficiency.",
  },
  [CATEGORIES.ARCHITECTURE]: {
    verifiable: false,
    reason: "High-level architectural concepts (System Design, Microservices, Clean Architecture, OOP...) are conceptual paradigms that cannot be reliably benchmarked from repository inspection alone.",
  },
  [CATEGORIES.PROFESSIONAL]: {
    verifiable: false,
    reason: "Professional and interpersonal competencies (Leadership, Communication, Agile, Scrum...) are evaluated through interviews and work history rather than code repositories.",
  },
  [CATEGORIES.CERTIFICATION]: {
    verifiable: false,
    reason: "Formal certifications must be verified through official credential issuers or badge verification links.",
  },
};

// Canonical Technology Definitions: { canonicalName: { category, aliases: [] } }
const TECH_REGISTRY = {
  // ── 1. Programming Languages (GitHub Verifiable) ───────────────────────────
  "JavaScript":   { category: CATEGORIES.LANGUAGE, aliases: ["js", "javascript", "ecmascript", "es6", "es2020"] },
  "TypeScript":   { category: CATEGORIES.LANGUAGE, aliases: ["ts", "typescript"] },
  "Python":       { category: CATEGORIES.LANGUAGE, aliases: ["python", "python3", "py"] },
  "Java":         { category: CATEGORIES.LANGUAGE, aliases: ["java"] },
  "C++":          { category: CATEGORIES.LANGUAGE, aliases: ["cpp", "cplusplus", "c++"] },
  "C":            { category: CATEGORIES.LANGUAGE, aliases: ["c-lang", "c language"] },
  "C#":           { category: CATEGORIES.LANGUAGE, aliases: ["csharp", "c#", "c-sharp", "dotnet"] },
  "Go":           { category: CATEGORIES.LANGUAGE, aliases: ["golang", "go-lang", "go language"] },
  "Rust":         { category: CATEGORIES.LANGUAGE, aliases: ["rust", "rustlang"] },
  "Ruby":         { category: CATEGORIES.LANGUAGE, aliases: ["ruby"] },
  "PHP":          { category: CATEGORIES.LANGUAGE, aliases: ["php", "php8"] },
  "Swift":        { category: CATEGORIES.LANGUAGE, aliases: ["swift"] },
  "Kotlin":       { category: CATEGORIES.LANGUAGE, aliases: ["kotlin"] },
  "Dart":         { category: CATEGORIES.LANGUAGE, aliases: ["dart"] },
  "HTML":         { category: CATEGORIES.LANGUAGE, aliases: ["html", "html5"] },
  "CSS":          { category: CATEGORIES.LANGUAGE, aliases: ["css", "css3", "scss", "sass", "less"] },
  "SQL":          { category: CATEGORIES.LANGUAGE, aliases: ["sql"] },
  "Shell":        { category: CATEGORIES.LANGUAGE, aliases: ["bash", "sh", "zsh", "shell script", "shell"] },
  "R":            { category: CATEGORIES.LANGUAGE, aliases: ["r-lang", "r language"] },
  "Scala":        { category: CATEGORIES.LANGUAGE, aliases: ["scala"] },

  // ── 2. Frameworks (GitHub Verifiable) ──────────────────────────────────────
  "React":        { category: CATEGORIES.FRAMEWORK, aliases: ["react", "reactjs", "react.js", "react framework"] },
  "Next.js":      { category: CATEGORIES.FRAMEWORK, aliases: ["nextjs", "next.js", "next"] },
  "Vue":          { category: CATEGORIES.FRAMEWORK, aliases: ["vue", "vuejs", "vue.js", "vue3"] },
  "Nuxt.js":      { category: CATEGORIES.FRAMEWORK, aliases: ["nuxtjs", "nuxt.js", "nuxt"] },
  "Angular":      { category: CATEGORIES.FRAMEWORK, aliases: ["angular", "angularjs", "angular.js"] },
  "Svelte":       { category: CATEGORIES.FRAMEWORK, aliases: ["svelte", "sveltekit"] },
  "Express":      { category: CATEGORIES.FRAMEWORK, aliases: ["express", "expressjs", "express.js"] },
  "NestJS":       { category: CATEGORIES.FRAMEWORK, aliases: ["nestjs", "nest.js", "nest"] },
  "FastAPI":      { category: CATEGORIES.FRAMEWORK, aliases: ["fastapi", "fast-api"] },
  "Flask":        { category: CATEGORIES.FRAMEWORK, aliases: ["flask"] },
  "Django":       { category: CATEGORIES.FRAMEWORK, aliases: ["django"] },
  "Spring Boot":  { category: CATEGORIES.FRAMEWORK, aliases: ["spring boot", "springboot", "spring-boot", "spring"] },
  "Ruby on Rails":{ category: CATEGORIES.FRAMEWORK, aliases: ["rails", "ruby on rails", "ror"] },
  "Laravel":      { category: CATEGORIES.FRAMEWORK, aliases: ["laravel"] },
  "Flutter":      { category: CATEGORIES.FRAMEWORK, aliases: ["flutter"] },
  "React Native": { category: CATEGORIES.FRAMEWORK, aliases: ["react native", "react-native", "reactnative"] },

  // ── 3. Runtimes (GitHub Verifiable) ────────────────────────────────────────
  "Node.js":      { category: CATEGORIES.RUNTIME, aliases: ["nodejs", "node.js", "node", "node runtime"] },
  "Deno":         { category: CATEGORIES.RUNTIME, aliases: ["deno"] },
  "Bun":          { category: CATEGORIES.RUNTIME, aliases: ["bun"] },

  // ── 4. Libraries & UI (GitHub Verifiable) ──────────────────────────────────
  "Redux":        { category: CATEGORIES.LIBRARY, aliases: ["redux", "redux toolkit", "rtk"] },
  "Tailwind CSS": { category: CATEGORIES.LIBRARY, aliases: ["tailwind", "tailwindcss", "tailwind-css"] },
  "Bootstrap":    { category: CATEGORIES.LIBRARY, aliases: ["bootstrap", "bootstrap5"] },
  "Material-UI":  { category: CATEGORIES.LIBRARY, aliases: ["mui", "material ui", "material-ui", "@mui/material"] },
  "Framer Motion":{ category: CATEGORIES.LIBRARY, aliases: ["framer motion", "framer-motion"] },
  "Axios":        { category: CATEGORIES.LIBRARY, aliases: ["axios"] },
  "Socket.IO":    { category: CATEGORIES.LIBRARY, aliases: ["socket.io", "socketio", "websockets"] },
  "Mongoose":     { category: CATEGORIES.LIBRARY, aliases: ["mongoose"] },
  "Prisma":       { category: CATEGORIES.LIBRARY, aliases: ["prisma", "prisma orm"] },
  "Hibernate":    { category: CATEGORIES.LIBRARY, aliases: ["hibernate"] },
  "SQLAlchemy":   { category: CATEGORIES.LIBRARY, aliases: ["sqlalchemy"] },

  // ── 5. Databases (GitHub Verifiable via Drivers/Configs) ───────────────────
  "MongoDB":      { category: CATEGORIES.DATABASE, aliases: ["mongodb", "mongo", "mongo-db"] },
  "PostgreSQL":   { category: CATEGORIES.DATABASE, aliases: ["postgresql", "postgres", "psql"] },
  "MySQL":        { category: CATEGORIES.DATABASE, aliases: ["mysql", "my-sql"] },
  "Redis":        { category: CATEGORIES.DATABASE, aliases: ["redis", "ioredis"] },
  "SQLite":       { category: CATEGORIES.DATABASE, aliases: ["sqlite", "sqlite3"] },
  "Firebase":     { category: CATEGORIES.DATABASE, aliases: ["firebase", "firestore"] },
  "Supabase":     { category: CATEGORIES.DATABASE, aliases: ["supabase"] },
  "Cassandra":    { category: CATEGORIES.DATABASE, aliases: ["cassandra"] },
  "DynamoDB":     { category: CATEGORIES.DATABASE, aliases: ["dynamodb", "dynamo"] },
  "Elasticsearch":{ category: CATEGORIES.DATABASE, aliases: ["elasticsearch", "elastic search"] },

  // ── 6. DevOps & Containers (GitHub Verifiable via Configs) ─────────────────
  "Docker":       { category: CATEGORIES.DEVOPS_CONTAINER, aliases: ["docker", "dockerfile", "container", "containerization"] },
  "Kubernetes":   { category: CATEGORIES.DEVOPS_CONTAINER, aliases: ["kubernetes", "k8s", "helm", "helm chart"] },
  "Terraform":    { category: CATEGORIES.DEVOPS_CONTAINER, aliases: ["terraform", "tf"] },
  "GitHub Actions":{ category: CATEGORIES.DEVOPS_CONTAINER, aliases: ["github actions", "github action", "gh-actions"] },
  "CI/CD":        { category: CATEGORIES.DEVOPS_CONTAINER, aliases: ["ci/cd", "cicd", "continuous integration"] },

  // ── 7. Tools & Build Tools (GitHub Verifiable) ─────────────────────────────
  "Git":          { category: CATEGORIES.BUILD_TOOL, aliases: ["git", "version control"] },
  "Vite":         { category: CATEGORIES.BUILD_TOOL, aliases: ["vite", "vitejs"] },
  "Webpack":      { category: CATEGORIES.BUILD_TOOL, aliases: ["webpack"] },
  "npm":          { category: CATEGORIES.BUILD_TOOL, aliases: ["npm"] },
  "Yarn":         { category: CATEGORIES.BUILD_TOOL, aliases: ["yarn"] },
  "Maven":        { category: CATEGORIES.BUILD_TOOL, aliases: ["maven"] },
  "Gradle":       { category: CATEGORIES.BUILD_TOOL, aliases: ["gradle"] },

  // ── 8. AI, Machine Learning & Data (GitHub Verifiable) ─────────────────────
  "Pandas":       { category: CATEGORIES.DATA_AI, aliases: ["pandas"] },
  "NumPy":        { category: CATEGORIES.DATA_AI, aliases: ["numpy"] },
  "Scikit-learn": { category: CATEGORIES.DATA_AI, aliases: ["scikit-learn", "scikitlearn", "sklearn", "scikit"] },
  "XGBoost":      { category: CATEGORIES.DATA_AI, aliases: ["xgboost", "xgb"] },
  "SHAP":         { category: CATEGORIES.DATA_AI, aliases: ["shap"] },
  "PyTorch":      { category: CATEGORIES.DATA_AI, aliases: ["pytorch", "torch"] },
  "TensorFlow":   { category: CATEGORIES.DATA_AI, aliases: ["tensorflow", "tf"] },
  "Matplotlib":   { category: CATEGORIES.DATA_AI, aliases: ["matplotlib"] },
  "Seaborn":      { category: CATEGORIES.DATA_AI, aliases: ["seaborn"] },
  "Machine Learning": { category: CATEGORIES.DATA_AI, aliases: ["machine learning", "ml"] },
  "Deep Learning":    { category: CATEGORIES.DATA_AI, aliases: ["deep learning", "dl"] },

  // ════════════════════════════════════════════════════════════════════════════
  // ── 9. Cloud Platforms (OUTSIDE GitHub Verification Scope) ─────────────────
  // ════════════════════════════════════════════════════════════════════════════
  "AWS":          { category: CATEGORIES.CLOUD_PLATFORM, reason: "AWS expertise cannot be reliably verified from GitHub repository metadata alone.", aliases: ["aws", "amazon web services", "s3", "ec2", "lambda", "ecs", "eks", "rds", "cloudfront", "aws cloud"] },
  "Azure":        { category: CATEGORIES.CLOUD_PLATFORM, reason: "Azure expertise cannot be reliably verified from repository metadata alone without live cloud tenant access.", aliases: ["azure", "microsoft azure", "azure devops"] },
  "GCP":          { category: CATEGORIES.CLOUD_PLATFORM, reason: "Google Cloud Platform expertise cannot be reliably verified from public repository code alone.", aliases: ["gcp", "google cloud", "google cloud platform"] },
  "Heroku":       { category: CATEGORIES.CLOUD_PLATFORM, reason: "Cloud hosting usage alone does not demonstrate verified cloud architecture proficiency.", aliases: ["heroku"] },
  "DigitalOcean": { category: CATEGORIES.CLOUD_PLATFORM, reason: "Infrastructure hosting cannot be reliably verified from repository code alone.", aliases: ["digitalocean", "digital ocean"] },
  "Cloudflare":   { category: CATEGORIES.CLOUD_PLATFORM, reason: "Edge network configuration is outside reliable repository analysis scope.", aliases: ["cloudflare"] },
  "Vercel":       { category: CATEGORIES.CLOUD_PLATFORM, reason: "Deployment platform usage is outside reliable repository analysis scope.", aliases: ["vercel"] },
  "Netlify":      { category: CATEGORIES.CLOUD_PLATFORM, reason: "Hosting platform usage is outside reliable repository analysis scope.", aliases: ["netlify"] },

  // ════════════════════════════════════════════════════════════════════════════
  // ── 10. Protocols & Authentication (OUTSIDE GitHub Verification Scope) ─────
  // ════════════════════════════════════════════════════════════════════════════
  "JWT":          { category: CATEGORIES.AUTH_PROTOCOL, reason: "JWT authentication techniques cannot be reliably verified as professional expertise from repository metadata alone.", aliases: ["jwt", "jsonwebtoken", "json web token", "jwt authentication"] },
  "OAuth":        { category: CATEGORIES.AUTH_PROTOCOL, reason: "OAuth protocol integration alone does not establish professional security or identity architecture expertise.", aliases: ["oauth", "oauth2", "oauth 2.0", "sso", "openid"] },
  "AJAX":         { category: CATEGORIES.AUTH_PROTOCOL, reason: "AJAX represents a browser communication technique rather than a standalone verifiable engineering capability.", aliases: ["ajax", "xmlhttprequest", "asynchronous javascript and xml"] },
  "REST":         { category: CATEGORIES.AUTH_PROTOCOL, reason: "REST API knowledge represents an architectural convention outside the reliable verification scope of public repositories.", aliases: ["rest", "restful", "rest api", "rest apis", "restful apis", "rest api design", "rest api knowledge", "restful api", "restful web services"] },
  "GraphQL":      { category: CATEGORIES.AUTH_PROTOCOL, reason: "GraphQL query patterns alone do not establish comprehensive API architecture proficiency.", aliases: ["graphql", "gql"] },
  "SOAP":         { category: CATEGORIES.AUTH_PROTOCOL, reason: "Legacy XML protocol usage is outside the reliable verification scope of modern repository code.", aliases: ["soap"] },
  "gRPC":         { category: CATEGORIES.AUTH_PROTOCOL, reason: "Protocol buffer definitions alone do not establish comprehensive distributed networking proficiency.", aliases: ["grpc"] },
  "WebSocket":    { category: CATEGORIES.AUTH_PROTOCOL, reason: "Socket connection usage represents an implementation detail outside standalone verification scope.", aliases: ["websocket", "websockets", "ws"] },
  "HTTP/HTTPS":   { category: CATEGORIES.AUTH_PROTOCOL, reason: "Standard networking protocols are fundamental conventions outside specific repository verification.", aliases: ["http", "https", "http/https"] },

  // ════════════════════════════════════════════════════════════════════════════
  // ── 11. Architecture & Concepts (OUTSIDE GitHub Verification Scope) ────────
  // ════════════════════════════════════════════════════════════════════════════
  "System Design":             { category: CATEGORIES.ARCHITECTURE, reason: "System Design is a high-level conceptual competency that cannot be reliably benchmarked from public repository code alone.", aliases: ["system design", "distributed systems", "scalable architecture", "system architecture"] },
  "Microservices":            { category: CATEGORIES.ARCHITECTURE, reason: "Microservices Architecture is an enterprise architectural pattern outside the scope of repository file inspection.", aliases: ["microservices", "microservice", "microservice architecture", "microservices architecture"] },
  "API Security":              { category: CATEGORIES.ARCHITECTURE, reason: "Application security posture cannot be reliably proven through repository metadata alone.", aliases: ["api security", "web security", "owasp", "security"] },
  "Clean Architecture":        { category: CATEGORIES.ARCHITECTURE, reason: "Architectural patterns represent conceptual paradigms that cannot be benchmarked from file structures alone.", aliases: ["clean architecture", "hexagonal architecture", "onion architecture"] },
  "Design Patterns":           { category: CATEGORIES.ARCHITECTURE, reason: "Design pattern implementation cannot be reliably verified through automated repository heuristics.", aliases: ["design patterns", "gang of four", "gof"] },
  "OOP":                       { category: CATEGORIES.ARCHITECTURE, reason: "Object-oriented paradigm knowledge cannot be reliably benchmarked from repository inspection alone.", aliases: ["oop", "object oriented programming", "object-oriented programming"] },
  "Data Structures":           { category: CATEGORIES.ARCHITECTURE, reason: "Data structures & algorithms proficiency is assessed through technical interviews rather than public repository code.", aliases: ["data structures", "dsa", "algorithms", "data structures and algorithms"] },
  "SOLID Principles":          { category: CATEGORIES.ARCHITECTURE, reason: "SOLID principles are conceptual guidelines outside automated repository verification scope.", aliases: ["solid", "solid principles"] },
  "MVC":                       { category: CATEGORIES.ARCHITECTURE, reason: "MVC architectural pattern is a general software structure outside standalone verification scope.", aliases: ["mvc", "model view controller"] },

  // ════════════════════════════════════════════════════════════════════════════
  // ── 12. Professional & Soft Skills (OUTSIDE GitHub Verification Scope) ─────
  // ════════════════════════════════════════════════════════════════════════════
  "Leadership":        { category: CATEGORIES.PROFESSIONAL, reason: "Leadership and team guidance cannot be reliably evaluated through public code repositories.", aliases: ["leadership", "team lead", "technical lead", "team leadership", "technical leadership"] },
  "Communication":     { category: CATEGORIES.PROFESSIONAL, reason: "Communication and interpersonal effectiveness cannot be evaluated through public code repositories.", aliases: ["communication", "verbal communication", "written communication", "interpersonal skills"] },
  "Teamwork":          { category: CATEGORIES.PROFESSIONAL, reason: "Teamwork and cross-functional collaboration cannot be evaluated through public code repositories.", aliases: ["teamwork", "collaboration", "cross-functional collaboration", "cross-functional"] },
  "Problem Solving":   { category: CATEGORIES.PROFESSIONAL, reason: "Problem solving ability is assessed through technical interviews rather than repository inspection alone.", aliases: ["problem solving", "analytical skills", "critical thinking"] },
  "Agile":             { category: CATEGORIES.PROFESSIONAL, reason: "Agile workflow practices cannot be evaluated through public repository code.", aliases: ["agile", "agile methodology", "agile development"] },
  "Scrum":             { category: CATEGORIES.PROFESSIONAL, reason: "Scrum methodology and sprint execution cannot be evaluated through public repository code.", aliases: ["scrum", "sprints", "standup", "daily standups"] },
  "Project Management":{ category: CATEGORIES.PROFESSIONAL, reason: "Project management execution cannot be evaluated through public code repositories alone.", aliases: ["project management", "jira", "trello", "confluence"] },
  "Mentorship":        { category: CATEGORIES.PROFESSIONAL, reason: "Mentorship and coaching ability are evaluated through peer feedback rather than code repositories.", aliases: ["mentorship", "mentoring", "coaching"] },
};

// Build fast lookup index from alias -> canonical
const ALIAS_TO_CANONICAL = {};
const CANONICAL_KEYS = Object.keys(TECH_REGISTRY);

CANONICAL_KEYS.forEach((canonical) => {
  const normCanonical = canonical.toLowerCase().replace(/[\.\-_\s]/g, "");
  ALIAS_TO_CANONICAL[normCanonical] = canonical;

  const def = TECH_REGISTRY[canonical];
  def.aliases.forEach((alias) => {
    const normAlias = alias.toLowerCase().replace(/[\.\-_\s]/g, "");
    ALIAS_TO_CANONICAL[normAlias] = canonical;
  });
});

/**
 * Normalize any raw string (e.g. "ReactJS", "Node.js", "Mongo DB") to canonical name
 * @param {string} raw
 * @returns {string} Canonical name or trimmed original
 */
const normalizeTechName = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = raw.trim();
  const normalized = cleaned.toLowerCase().replace(/[\.\-_\s]/g, "");
  return ALIAS_TO_CANONICAL[normalized] || cleaned;
};

/**
 * Get category for a technology
 */
const getTechCategory = (name) => {
  const canonical = normalizeTechName(name);
  return TECH_REGISTRY[canonical]?.category || "General";
};

/**
 * Check whether a technology is eligible for GitHub repository verification
 * @param {string} techName
 * @returns {{ isVerifiable: boolean, category: string, reason?: string }}
 */
const checkVerificationEligibility = (techName) => {
  const canonical = normalizeTechName(techName);
  const def = TECH_REGISTRY[canonical];
  const category = def?.category || "General";

  const eligibility = CATEGORY_ELIGIBILITY[category];
  if (eligibility) {
    return {
      canonical,
      isVerifiable: eligibility.verifiable,
      category,
      reason: def?.reason || eligibility.reason || null,
    };
  }

  // Default heuristic for unknown skills:
  // If not explicitly registered as verifiable, treat as non-verifiable general skill
  return {
    canonical,
    isVerifiable: false,
    category: "General",
    reason: "Not evaluated because this skill cannot be reliably verified through public GitHub repository evidence.",
  };
};

// NPM package name -> canonical tech evidence
const NPM_PACKAGE_MAP = {
  react: "React",
  "react-dom": "React",
  "react-scripts": "React",
  next: "Next.js",
  vue: "Vue",
  nuxt: "Nuxt.js",
  "@angular/core": "Angular",
  svelte: "Svelte",
  express: "Express",
  "@nestjs/core": "NestJS",
  mongodb: "MongoDB",
  mongoose: "MongoDB",
  mysql: "MySQL",
  mysql2: "MySQL",
  pg: "PostgreSQL",
  redis: "Redis",
  ioredis: "Redis",
  sqlite3: "SQLite",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  "@mui/material": "Material-UI",
  "framer-motion": "Framer Motion",
  axios: "Axios",
  "socket.io": "Socket.IO",
  "socket.io-client": "Socket.IO",
  vite: "Vite",
  webpack: "Webpack",
  prisma: "Prisma",
  "@prisma/client": "Prisma",
  redux: "Redux",
  "@reduxjs/toolkit": "Redux",
  dockerode: "Docker",
};

// Python pip package name -> canonical tech evidence
const PIP_PACKAGE_MAP = {
  flask: "Flask",
  "flask-cors": "Flask",
  django: "Django",
  fastapi: "FastAPI",
  pandas: "Pandas",
  numpy: "NumPy",
  "scikit-learn": "Scikit-learn",
  sklearn: "Scikit-learn",
  xgboost: "XGBoost",
  shap: "SHAP",
  torch: "PyTorch",
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  matplotlib: "Matplotlib",
  seaborn: "Seaborn",
  pymongo: "MongoDB",
  mysqlclient: "MySQL",
  "mysql-connector-python": "MySQL",
  pymysql: "MySQL",
  psycopg2: "PostgreSQL",
  "psycopg2-binary": "PostgreSQL",
  sqlalchemy: "SQLAlchemy",
  redis: "Redis",
  celery: "Celery",
  docker: "Docker",
};

// File extension -> technology evidence signal (array of canonical tech names)
const EXTENSION_MAP = {
  ".html": ["HTML"],
  ".htm":  ["HTML"],
  ".css":  ["CSS"],
  ".scss": ["CSS"],
  ".sass": ["CSS"],
  ".less": ["CSS"],
  ".js":   ["JavaScript"],
  ".mjs":  ["JavaScript"],
  ".cjs":  ["JavaScript"],
  ".jsx":  ["React"],
  ".ts":   ["TypeScript"],
  ".mts":  ["TypeScript"],
  ".cts":  ["TypeScript"],
  ".tsx":  ["TypeScript", "React"],
  ".py":   ["Python"],
  ".java": ["Java"],
  ".cpp":  ["C++"],
  ".cc":   ["C++"],
  ".cxx":  ["C++"],
  ".hpp":  ["C++"],
  ".c":    ["C"],
  ".h":    ["C", "C++"],
  ".go":   ["Go"],
  ".rs":   ["Rust"],
  ".php":  ["PHP"],
  ".rb":   ["Ruby"],
  ".swift":["Swift"],
  ".kt":   ["Kotlin"],
  ".kts":  ["Kotlin"],
  ".dart": ["Dart"],
  ".sql":  ["SQL"],
  ".sh":   ["Shell"],
  ".bash": ["Shell"],
  ".zsh":  ["Shell"],
  ".vue":  ["Vue"],
  ".svelte":["Svelte"],
};

/**
 * Check if text contains a specific technology using word boundaries
 * Avoids substring false positives like "Java" in "JavaScript"
 */
const textContainsTech = (text, canonicalTech) => {
  if (!text || !canonicalTech) return false;
  const def = TECH_REGISTRY[canonicalTech];
  const terms = [canonicalTech, ...(def?.aliases || [])];

  for (const term of terms) {
    const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      if (term.toLowerCase() === "java" && /\bjavascript\b/i.test(text)) {
        const withoutJS = text.replace(/\bjavascript\b/gi, "");
        if (!/\bjava\b/i.test(withoutJS)) continue;
      }
      if (term.toLowerCase() === "c") {
        if (!/\b(c language|c programming|c\/c\+\+|ansi c)\b/i.test(text)) continue;
      }
      return true;
    }
  }
  return false;
};

module.exports = {
  CATEGORIES,
  CATEGORY_ELIGIBILITY,
  TECH_REGISTRY,
  CANONICAL_KEYS,
  normalizeTechName,
  getTechCategory,
  checkVerificationEligibility,
  NPM_PACKAGE_MAP,
  PIP_PACKAGE_MAP,
  EXTENSION_MAP,
  textContainsTech,
};
