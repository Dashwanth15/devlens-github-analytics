/**
 * gemini.service.js - Google Gemini AI Gateway with Robust Deterministic Fallback
 *
 * RESPONSIBILITIES:
 * 1. AI-assisted resume extraction (with rich deterministic dictionary fallback).
 * 2. AI-assisted verification synthesis (reasoning, strengths, gaps, recommendations).
 * 3. Graceful degradation: If Gemini API key is missing or invalid (401), the system
 *    seamlessly falls back to the deterministic engine without breaking verification.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");
const {
  CANONICAL_KEYS,
  TECH_REGISTRY,
  normalizeTechName,
  getTechCategory,
  textContainsTech,
} = require("../utils/technologyTaxonomy");

let genAI = null;
let model = null;

const getModel = () => {
  if (!env.gemini.enabled || !env.gemini.apiKey) {
    return null;
  }
  if (!model) {
    try {
      genAI = new GoogleGenerativeAI(env.gemini.apiKey);
      model = genAI.getGenerativeModel({
        model: env.gemini.model || "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
    } catch (err) {
      console.warn("⚠️ Failed to initialize GoogleGenerativeAI client:", err.message);
      return null;
    }
  }
  return model;
};

/**
 * Safely parse JSON from model response text
 */
const parseJsonResponse = (text) => {
  if (!text) return null;
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * Deterministic Resume Data Extractor (Robust Fallback covering 200+ technologies)
 * Used when Gemini is not configured, API key is invalid, or quota is exceeded.
 */
const extractResumeDataDeterministic = (text) => {
  const normalizedText = (text || "").toLowerCase();
  const detectedSkills = [];
  const detectedTech = [];

  // Scan all canonical technologies from our registry
  CANONICAL_KEYS.forEach((canonical) => {
    if (textContainsTech(text, canonical)) {
      const category = getTechCategory(canonical);
      if (category === "Programming Language" || category === "Framework" || category === "Library" || category === "Runtime") {
        detectedSkills.push(canonical);
      } else {
        detectedTech.push(canonical);
      }
    }
  });

  // Extract years of experience
  let experience_years = 2.0;
  const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?(?:\s+experience)?/i);
  if (expMatch) {
    experience_years = parseFloat(expMatch[1]);
  }

  // Determine specializations
  const specializations = [];
  if (/frontend|react|vue|angular|css|html/i.test(normalizedText)) specializations.push("Frontend");
  if (/backend|node|express|flask|django|spring|sql|mongo/i.test(normalizedText)) specializations.push("Backend");
  if (specializations.includes("Frontend") && specializations.includes("Backend")) specializations.push("Full-Stack");
  if (/docker|kubernetes|aws|ci\/cd|devops/i.test(normalizedText)) specializations.push("DevOps");
  if (/machine learning|deep learning|data science|pandas|numpy|pytorch|tensorflow/i.test(normalizedText)) specializations.push("AI & Data Science");
  if (specializations.length === 0) specializations.push("Software Engineer");

  // Extract project mentions
  const projects = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const cleanLine = line.replace(/^[*\-\s\d•#]+/, "").trim();
    if (
      /(platform|system|application|app|service|api|bot|analyzer|dashboard|manager|tool)/i.test(cleanLine) &&
      cleanLine.length >= 8 &&
      cleanLine.length <= 60 &&
      !cleanLine.toLowerCase().startsWith("experience") &&
      !cleanLine.toLowerCase().startsWith("skills")
    ) {
      projects.push(cleanLine);
    }
    if (projects.length >= 4) break;
  }
  if (projects.length === 0) {
    projects.push("Full-Stack Application", "REST API Service", "Portfolio Project");
  }

  return {
    skills: [...new Set(detectedSkills)],
    technologies: [...new Set(detectedTech)],
    projects: [...new Set(projects)].slice(0, 4),
    experience_years,
    specializations: [...new Set(specializations)],
  };
};

/**
 * Extract structured resume data using Gemini with fallback
 * @param {string} resumeText
 * @returns {Object} Structured resume data
 */
const extractResumeData = async (resumeText) => {
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `You are a technical recruiter AI. Extract technical information explicitly stated in this resume text.
Do NOT hallucinate or assume technologies.

Return ONLY valid JSON in this exact shape:
{
  "skills": ["JavaScript", "HTML", "CSS", "React", "Node.js", "Express", "Python", "Flask"],
  "technologies": ["MongoDB", "MySQL", "Docker", "AWS", "Git", "JWT", "REST", "Tailwind CSS"],
  "projects": ["Project Name 1", "Project Name 2"],
  "experience_years": 3.0,
  "specializations": ["Full-Stack", "Backend"]
}

Definitions:
- skills: programming languages, web frameworks, runtimes, and libraries explicitly claimed
- technologies: databases, cloud providers, devops tools, APIs, and dev utilities explicitly claimed
- projects: major project titles described
- experience_years: total years of professional/development experience as a number or null
- specializations: developer focus areas

Resume text:
---
${resumeText}
---`;

      const result = await aiModel.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseJsonResponse(text);
      if (parsed && Array.isArray(parsed.skills)) {
        return {
          skills: (parsed.skills || []).map(normalizeTechName),
          technologies: (parsed.technologies || []).map(normalizeTechName),
          projects: parsed.projects || [],
          experience_years: parsed.experience_years || null,
          specializations: parsed.specializations || [],
        };
      }
    } catch (err) {
      console.warn("⚠️ Gemini resume extraction failed (falling back to deterministic parser):", err.message);
    }
  }

  return extractResumeDataDeterministic(resumeText);
};

/**
 * Synthesize verification explanations, strengths, and gaps using Gemini or deterministic fallback
 */
const synthesizeVerification = async ({ username, verificationReport, missingEvidence, inspectedRepos }) => {
  const verifiedList = verificationReport.filter((r) => r.status === "verified");
  const partialList = verificationReport.filter((r) => r.status === "partially_verified");
  const missingList = missingEvidence || [];

  // Deterministic synthesis baseline
  const baselineStrengths = [];
  const baselineGaps = [];
  const baselineRecs = [];

  if (verifiedList.length > 0) {
    const topSkills = verifiedList.slice(0, 5).map((s) => s.skill).join(", ");
    baselineStrengths.push(`Strong, repository-verified technical competency in ${topSkills}.`);
    const manifestVerified = verifiedList.filter((s) => s.evidence.some((e) => e.type === "dependency"));
    if (manifestVerified.length > 0) {
      baselineStrengths.push(
        `Production package dependencies confirmed for ${manifestVerified.map((s) => s.skill).join(", ")}.`
      );
    }
  }

  if (missingList.length > 0) {
    baselineGaps.push(
      `No public GitHub evidence found for ${missingList.slice(0, 4).join(", ")}.`
    );
    baselineRecs.push(
      `Publish or link public repositories showcasing your experience with ${missingList.slice(0, 3).join(", ")} to turn these claims into verified credentials.`
    );
  }

  if (baselineRecs.length === 0) {
    baselineRecs.push("Maintain comprehensive README documentation and dependency locks to ensure automated verifiability.");
  }

  const aiModel = getModel();
  if (!aiModel) {
    return {
      strengths: baselineStrengths,
      evidence_gaps: baselineGaps,
      recommendations: baselineRecs,
    };
  }

  try {
    const evidenceSummary = verificationReport.map((r) => ({
      skill: r.skill,
      status: r.status,
      confidence: r.confidence,
      evidence_count: r.evidence.length,
      sample_evidence: r.evidence[0]?.detail || "No direct evidence",
    }));

    const prompt = `You are DevLens Developer Intelligence AI. Review this developer's resume claims and real GitHub repository evidence.
Strictly adhere to the provided evidence. DO NOT hallucinate technologies, repositories, or accomplishments.

Candidate: ${username}
Verified Evidence Table:
${JSON.stringify(evidenceSummary, null, 2)}

Return ONLY valid JSON:
{
  "strengths": [
    "1-2 concise sentences highlighting the strongest verified skills and repository proof"
  ],
  "evidence_gaps": [
    "1-2 concise sentences identifying claimed resume skills that lack public GitHub evidence"
  ],
  "recommendations": [
    "1-2 actionable technical recommendations for the developer to strengthen their GitHub profile"
  ]
}`;

    const result = await aiModel.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text());
    if (parsed && Array.isArray(parsed.strengths) && parsed.strengths.length > 0) {
      return {
        strengths: parsed.strengths,
        evidence_gaps: parsed.evidence_gaps || baselineGaps,
        recommendations: parsed.recommendations || baselineRecs,
      };
    }
  } catch (err) {
    console.warn("⚠️ Gemini verification synthesis failed (using deterministic synthesis):", err.message);
  }

  return {
    strengths: baselineStrengths,
    evidence_gaps: baselineGaps,
    recommendations: baselineRecs,
  };
};

/**
 * Extract structured requirements from a job description
 * Returns { role_title, experience_level, required_skills, nice_to_have }
 */
const extractJobRequirements = async (jobDescription) => {
  const text = (jobDescription || "").toLowerCase();

  // Baseline deterministic extraction
  const detectedSkills = [];
  for (const [key, meta] of Object.entries(TECH_REGISTRY)) {
    if (textContainsTech(text, key, meta)) {
      detectedSkills.push(key);
    }
  }

  // Partition into required vs nice to have based on keywords/sections
  const niceToHaveKeywords = ["nice to have", "preferred", "bonus", "plus", "optional", "good to have"];
  const lowerJd = (jobDescription || "").toLowerCase();

  let niceToHaveSection = "";
  for (const kw of niceToHaveKeywords) {
    const idx = lowerJd.indexOf(kw);
    if (idx !== -1) {
      niceToHaveSection += " " + lowerJd.slice(idx);
    }
  }

  const required_skills = [];
  const nice_to_have = [];

  for (const skill of detectedSkills) {
    if (!skill || typeof skill !== "string") continue;
    const sLower = skill.toLowerCase();
    if (niceToHaveSection.includes(sLower) && !required_skills.includes(skill)) {
      nice_to_have.push(skill);
    } else {
      required_skills.push(skill);
    }
  }

  // Determine experience level
  let experience_level = "mid";
  if (/\b(senior|lead|principal|staff|architect|5\+|6\+|7\+|8\+|10\+)\b/i.test(jobDescription)) {
    experience_level = "senior";
  } else if (/\b(junior|entry|intern|graduate|0-2|1-2)\b/i.test(jobDescription)) {
    experience_level = "junior";
  }

  const fallback = {
    role_title: "Software Engineer",
    experience_level,
    required_skills: required_skills.length > 0 ? required_skills : ["JavaScript", "Python"],
    nice_to_have: nice_to_have,
  };

  const aiModel = getModel();
  if (!aiModel) {
    return fallback;
  }

  try {
    const prompt = `You are a technical recruiter. Extract structured technical requirements from this job description.

Job Description:
${jobDescription.slice(0, 3000)}

Return ONLY valid JSON in this exact structure:
{
  "role_title": "extracted or inferred job title",
  "experience_level": "junior | mid | senior | lead",
  "required_skills": ["Skill1", "Skill2", "Skill3"],
  "nice_to_have": ["Skill4", "Skill5"]
}`;

    const result = await aiModel.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text());
    if (parsed && Array.isArray(parsed.required_skills) && parsed.required_skills.length > 0) {
      return {
        role_title: parsed.role_title || fallback.role_title,
        experience_level: parsed.experience_level || fallback.experience_level,
        required_skills: parsed.required_skills,
        nice_to_have: Array.isArray(parsed.nice_to_have) ? parsed.nice_to_have : fallback.nice_to_have,
      };
    }
  } catch (err) {
    console.warn("⚠️ Gemini job extraction failed (using deterministic fallback):", err.message);
  }

  return fallback;
};

module.exports = {
  extractResumeData,
  extractResumeDataDeterministic,
  synthesizeVerification,
  extractJobRequirements,
};
