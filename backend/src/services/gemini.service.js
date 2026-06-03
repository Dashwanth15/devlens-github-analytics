/**
 * gemini.service.js - Google Gemini AI Gateway
 *
 * RESPONSIBILITY: All Gemini API calls route through here.
 * No other service instantiates the Gemini client directly.
 *
 * Why centralized?
 * - Single place to swap AI provider (OpenAI, Anthropic, etc.)
 * - Centralized prompt versioning and error handling
 * - Prevents duplicate client initialization
 * - Easy to add caching, retry logic, or quota tracking later
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

let genAI = null;
let model = null;

// Lazy initialization — only create client if API key is present
const getModel = () => {
  if (!env.gemini.enabled) {
    throw new Error("Gemini AI is not configured. Add GEMINI_API_KEY to your .env file.");
  }
  if (!model) {
    genAI = new GoogleGenerativeAI(env.gemini.apiKey);
    model = genAI.getGenerativeModel({
      model: env.gemini.model,
      generationConfig: {
        responseMimeType: "application/json", // Force JSON-only responses
        temperature: 0.1,                     // Low temp = deterministic extraction
      },
    });
  }
  return model;
};

/**
 * Parse JSON from Gemini response text safely
 * Handles cases where the model wraps JSON in markdown code blocks
 */
const parseJsonResponse = (text) => {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
};

const COMMON_SKILLS = [
  "React", "Vue", "Angular", "Node.js", "Express", "Python", "Django", "Flask",
  "Java", "Spring", "C#", "Go", "Rust", "TypeScript", "JavaScript", "HTML",
  "CSS", "SQL", "NoSQL", "Ruby", "Rails", "PHP", "Laravel"
];

const COMMON_TECH = [
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "Jenkins", "CI/CD",
  "Redis", "PostgreSQL", "MySQL", "MongoDB", "Firebase", "Lambda", "EC2",
  "S3", "GraphQL", "REST", "Jira"
];

const generateMockResumeData = (text) => {
  const normalizedText = text.toLowerCase();
  
  // Extract matching skills
  const skills = COMMON_SKILLS.filter(skill => {
    const norm = skill.toLowerCase();
    const escaped = norm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText) || normalizedText.includes(norm);
  });
  
  // Extract matching tech
  const technologies = COMMON_TECH.filter(tech => {
    const norm = tech.toLowerCase();
    const escaped = norm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText) || normalizedText.includes(norm);
  });

  // Extract years of experience
  let experience_years = 3.0;
  const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*years?/i);
  if (expMatch) {
    experience_years = parseFloat(expMatch[1]);
  }

  // Guess specialization
  const specializations = [];
  if (normalizedText.includes("frontend") || normalizedText.includes("react") || normalizedText.includes("vue")) {
    specializations.push("Frontend");
  }
  if (normalizedText.includes("backend") || normalizedText.includes("node") || normalizedText.includes("python")) {
    specializations.push("Backend");
  }
  if (specializations.length === 2) {
    specializations.push("Full-Stack");
  }
  if (normalizedText.includes("devops") || normalizedText.includes("docker") || normalizedText.includes("kubernetes")) {
    specializations.push("DevOps");
  }
  if (specializations.length === 0) {
    specializations.push("Software Engineer");
  }

  // Extract some project-like phrases or generate mock projects
  const projects = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes("project") || line.toLowerCase().includes("developed") || line.toLowerCase().includes("built")) {
      const cleanLine = line.replace(/^[*\-\s\d•]+/, '').trim();
      if (cleanLine.length > 10 && cleanLine.length < 60) {
        projects.push(cleanLine);
      }
    }
    if (projects.length >= 3) break;
  }
  if (projects.length === 0) {
    projects.push("E-Commerce Web App", "Task Management API", "Personal Portfolio");
  }

  return {
    skills: skills.length > 0 ? skills : ["JavaScript", "HTML", "CSS"],
    technologies: technologies.length > 0 ? technologies : ["Git", "MySQL"],
    projects: projects.slice(0, 3),
    experience_years,
    specializations: [...new Set(specializations)]
  };
};

const generateMockJobRequirements = (text) => {
  const normalizedText = text.toLowerCase();
  
  // Title extraction: search first few lines for engineer/developer/architect
  let job_title = "Software Engineer";
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (/(engineer|developer|architect|programmer|lead|manager)/i.test(lines[i])) {
      job_title = lines[i];
      break;
    }
  }
  
  // Skill extraction
  const foundSkills = COMMON_SKILLS.filter(skill => {
    const norm = skill.toLowerCase();
    const escaped = norm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText) || normalizedText.includes(norm);
  });
  
  const foundTech = COMMON_TECH.filter(tech => {
    const norm = tech.toLowerCase();
    const escaped = norm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText) || normalizedText.includes(norm);
  });

  // Separate into required vs nice_to_have
  const required_skills = foundSkills.slice(0, Math.max(3, Math.ceil(foundSkills.length / 2)));
  const nice_to_have = [
    ...foundSkills.slice(required_skills.length),
    ...foundTech
  ].slice(0, 5);

  // Level
  let experience_level = "mid";
  if (normalizedText.includes("senior") || normalizedText.includes("sr.")) experience_level = "senior";
  else if (normalizedText.includes("lead") || normalizedText.includes("principal")) experience_level = "lead";
  else if (normalizedText.includes("junior") || normalizedText.includes("jr.") || normalizedText.includes("entry")) experience_level = "junior";

  // Min years
  let experience_years_min = 2;
  const expMatch = text.match(/(?:at least|minimum|requried|prefer|require|has)\s*(\d+)\+?\s*years?/i);
  if (expMatch) {
    experience_years_min = parseInt(expMatch[1], 10);
  }

  // Domain
  let domain = "saas";
  if (normalizedText.includes("finance") || normalizedText.includes("fintech") || normalizedText.includes("bank")) domain = "fintech";
  else if (normalizedText.includes("health") || normalizedText.includes("medical")) domain = "healthtech";
  else if (normalizedText.includes("shop") || normalizedText.includes("commerce") || normalizedText.includes("store")) domain = "ecommerce";
  else if (normalizedText.includes("game") || normalizedText.includes("play")) domain = "gaming";

  return {
    job_title,
    required_skills: required_skills.length > 0 ? required_skills : ["JavaScript", "React"],
    nice_to_have: nice_to_have.length > 0 ? nice_to_have : ["Docker", "Git"],
    experience_level,
    experience_years_min,
    domain
  };
};

/**
 * Extract structured data from resume text
 * @param {string} resumeText - Clean text from PDF or paste
 * @returns {Object} { skills, technologies, projects, experience_years, specializations }
 */
const extractResumeData = async (resumeText) => {
  if (!env.gemini.enabled) {
    console.warn("⚠️ Gemini API key not found. Using fallback mock parser.");
    return generateMockResumeData(resumeText);
  }
  const aiModel = getModel();

  const prompt = `You are a technical recruiter AI that extracts structured information from resumes.

Extract ONLY information explicitly stated in the resume text. Do NOT infer or hallucinate.

Return ONLY valid JSON in this exact shape (no extra keys, no markdown):
{
  "skills": ["React", "Node.js", "Python"],
  "technologies": ["AWS", "Docker", "PostgreSQL", "Redis"],
  "projects": ["E-commerce Platform", "ML Pipeline", "REST API"],
  "experience_years": 4.5,
  "specializations": ["Frontend", "Full-Stack", "DevOps"]
}

Definitions:
- skills: programming languages and frameworks explicitly mentioned
- technologies: tools, platforms, cloud services, databases explicitly mentioned
- projects: project names or types of projects described
- experience_years: total years of professional software development experience (number, not string). Use null if not stated.
- specializations: domain areas the candidate focuses on

Resume text:
---
${resumeText}
---`;

  const result = await aiModel.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

/**
 * Extract structured requirements from a job description
 * @param {string} jobDescription - Raw job description text
 * @returns {Object} { job_title, required_skills, nice_to_have, experience_level, experience_years_min, domain }
 */
const extractJobRequirements = async (jobDescription) => {
  if (!env.gemini.enabled) {
    console.warn("⚠️ Gemini API key not found. Using fallback mock parser.");
    return generateMockJobRequirements(jobDescription);
  }
  const aiModel = getModel();

  const prompt = `You are a technical hiring manager AI that extracts structured requirements from job descriptions.

Return ONLY valid JSON in this exact shape (no extra keys, no markdown):
{
  "job_title": "Senior Frontend Engineer",
  "required_skills": ["React", "TypeScript", "Node.js"],
  "nice_to_have": ["Docker", "AWS", "GraphQL"],
  "experience_level": "senior",
  "experience_years_min": 4,
  "domain": "fintech"
}

Definitions:
- required_skills: technologies/skills explicitly stated as required or must-have (ONLY programming languages, frameworks, and tools — not soft skills)
- nice_to_have: preferred, bonus, or nice-to-have technical skills
- experience_level: one of exactly [junior, mid, senior, lead, principal] — pick closest match
- experience_years_min: minimum years of experience mentioned as a number, or null if not stated
- domain: industry or product domain (e.g., fintech, healthtech, ecommerce, saas, gaming) or null

Job description:
---
${jobDescription}
---`;

  const result = await aiModel.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
};

module.exports = { extractResumeData, extractJobRequirements };
