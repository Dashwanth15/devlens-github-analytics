import { useState, useEffect, useCallback, useRef } from "react";
import { analyzeResumeFile, analyzeResumeText, downloadResumePdfReport } from "../api/resumeApi";
import { getAllProfiles } from "../api/profileApi";
import { extractUsername } from "../utils/github";
import GitHubDeveloperInput from "../components/GitHubDeveloperInput";

// ── Status badge helpers ─────────────────────────────────────────────────────
const STATUS_META = {
  verified:               { label: "Verified",             color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✓" },
  partially_verified:     { label: "Partially Verified",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "◐" },
  limited:                { label: "Partially Verified",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "◐" }, // legacy
  not_found:              { label: "Evidence Not Found",   color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "✕" },
  not_github_verifiable:  { label: "Outside Scope",        color: "#818cf8", bg: "rgba(129,140,248,0.12)", icon: "⊘" },
};

function SkillBadge({ item }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[item.status] || STATUS_META.not_found;
  const hasEvidence = (item.evidence && item.evidence.length > 0) || (item.evidence_items && item.evidence_items.length > 0);
  const isOutsideScope = item.status === "not_github_verifiable";

  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      background: isOutsideScope ? "rgba(99,102,241,0.03)" : "var(--bg-card)",
      border: `1px solid ${isOutsideScope ? "rgba(129,140,248,0.22)" : "var(--border-primary)"}`,
      transition: "all 0.2s",
      overflow: "hidden",
    }}>
      <div
        onClick={() => hasEvidence && setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: "var(--s3)",
          padding: "var(--s3) var(--s4)",
          cursor: hasEvidence ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: "50%",
          background: meta.bg, color: meta.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
        }}>
          {meta.icon}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.92rem" }}>
              {item.skill}
            </span>
            {item.category && (
              <span style={{
                fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99,
                background: "var(--bg-secondary)", color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)", fontWeight: 500,
              }}>
                {item.category}
              </span>
            )}
            {!isOutsideScope && item.repositories_inspected_count !== undefined && (
              <span style={{
                fontSize: "0.68rem", padding: "1px 7px", borderRadius: 99,
                background: "rgba(99,102,241,0.08)", color: "var(--accent-primary)",
                border: "1px solid rgba(99,102,241,0.2)", fontWeight: 600,
              }}>
                {item.repositories_inspected_count} {item.repositories_inspected_count === 1 ? "repo" : "repos"} inspected
              </span>
            )}
          </div>

          <div style={{ fontSize: "0.78rem", color: isOutsideScope ? "var(--text-muted)" : "var(--text-secondary)", marginTop: 3, lineHeight: 1.4 }}>
            {item.reasoning || (item.evidence?.length > 0 ? item.evidence[0] : "No public GitHub evidence found.")}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "var(--s2)" }}>
          {item.confidence !== null && item.confidence !== undefined ? (
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: meta.color }}>
              {item.confidence}%
            </div>
          ) : (
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Excluded
            </div>
          )}
          <div style={{
            fontSize: "0.65rem", padding: "1px 7px", borderRadius: 99,
            background: meta.bg, color: meta.color, fontWeight: 700, marginTop: 2,
          }}>
            {meta.label}
          </div>
        </div>

        {hasEvidence && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "var(--s1)" }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Expanded evidence drawer */}
      {expanded && hasEvidence && (
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "var(--s3) var(--s4)",
          background: "var(--bg-secondary)",
          display: "flex", flexDirection: "column", gap: "var(--s2)",
        }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Evidence Traced in Public Repositories:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(item.evidence_items || []).map((ev, idx) => (
              <div key={idx} style={{
                fontSize: "0.78rem", color: "var(--text-primary)",
                display: "flex", alignItems: "baseline", gap: 8,
              }}>
                <span style={{
                  color: ev.strength === "VERY_STRONG" ? "#10b981" : ev.strength === "STRONG" ? "#3b82f6" : "var(--accent-primary)",
                  fontWeight: 700, fontSize: "0.7rem",
                }}>
                  • [{ev.source || ev.type}]
                </span>
                <span>{ev.detail}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>({ev.repository})</span>
              </div>
            ))}
            {(!item.evidence_items || item.evidence_items.length === 0) && item.evidence?.map((line, idx) => (
              <div key={idx} style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
                • {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score, size = 140 }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-primary)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)" }}>
          {Math.round(score)}%
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em" }}>
          VERIFIED
        </div>
      </div>
    </div>
  );
}

export default function Resume() {
  const [mode, setMode] = useState("file"); // "file" | "text"
  const [username, setUsername] = useState("");
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [skillFilter, setSkillFilter] = useState("all"); // "all" | "verified" | "partial" | "missing"
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [recentProfiles, setRecentProfiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getAllProfiles(1, 10)
      .then((res) => setRecentProfiles(res.data || []))
      .catch(() => {});
  }, []);

  const handleDownloadReport = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      await downloadResumePdfReport(result, username || result.username);
    } catch (err) {
      console.error("PDF download failed:", err);
      setError("Failed to download PDF report. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleAnalyze = async () => {
    const cleanUsername = extractUsername(username);
    if (!cleanUsername) return setError("Enter a GitHub username.");
    setUsername(cleanUsername);
    if (mode === "file" && !file) return setError("Upload a resume file.");
    if (mode === "text" && pastedText.trim().length < 50) return setError("Paste at least 50 characters of resume text.");

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let res;
      if (mode === "file") {
        res = await analyzeResumeFile(cleanUsername, file);
      } else {
        res = await analyzeResumeText(cleanUsername, pastedText.trim());
      }
      const payload = res?.data?.data || res?.data || res;
      setResult(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const verified = result?.verification_report?.filter((r) => r.status === "verified") || [];
  const partial  = result?.verification_report?.filter((r) => r.status === "partially_verified" || r.status === "limited") || [];
  const missing  = result?.verification_report?.filter((r) => r.status === "not_found") || [];
  const outsideScope = result?.verification_report?.filter((r) => r.status === "not_github_verifiable") || [];

  const displayedSkills = (result?.verification_report || []).filter((item) => {
    if (skillFilter === "verified") return item.status === "verified" || item.status === "partially_verified" || item.status === "limited";
    if (skillFilter === "missing") return item.status === "not_found";
    if (skillFilter === "outside_scope") return item.status === "not_github_verifiable";
    return true;
  });

  return (
    <div className="page-content">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Resume Verification</h1>
          <p className="page-subtitle">
            Cross-reference resume claims against real GitHub activity, package manifests, and repository intelligence.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "var(--s6)", alignItems: "start" }}>

        {/* ── LEFT PANEL: Input ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

          {/* GitHub profile input */}
          <div className="card" style={{ padding: "var(--s5)" }}>
            <GitHubDeveloperInput
              id="resume-profile-input"
              label="Candidate GitHub Profile"
              value={username}
              onChange={(val) => {
                setUsername(val);
                setError(null);
              }}
              onSelectProfile={(p) => {
                setUsername(p.username);
                setError(null);
              }}
              recentProfiles={recentProfiles}
              placeholder="e.g. Dashwanth15 or github.com/username"
              helperText="Analyze any public GitHub profile — saved profiles are only recent suggestions."
              onClear={() => setUsername("")}
              disabled={loading}
              accentColor="#818CF8"
            />
          </div>

          {/* Mode toggle */}
          <div className="card">
            <div style={{ display: "flex", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
              {["file", "text"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-ghost"}`}
                  style={{ flex: 1 }}>
                  {m === "file" ? "📎 Upload PDF" : "📝 Paste Text"}
                </button>
              ))}
            </div>

            {mode === "file" ? (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "var(--accent-primary)" : "var(--border-primary)"}`,
                    borderRadius: "var(--radius-lg)", padding: "var(--s8)",
                    textAlign: "center", cursor: "pointer",
                    background: dragOver ? "rgba(99,102,241,0.05)" : "var(--bg-secondary)",
                    transition: "all 0.2s",
                  }}>
                  <div style={{ fontSize: "2rem", marginBottom: "var(--s2)" }}>📄</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    {file ? (
                      <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                        {file.name}
                        <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </span>
                    ) : (
                      <>Drop PDF here or <span style={{ color: "var(--accent-primary)" }}>click to browse</span></>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--s1)" }}>
                    PDF or .txt · Max 10MB
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </>
            ) : (
              <textarea
                className="input"
                placeholder="Paste your resume text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                style={{ width: "100%", minHeight: 200, boxSizing: "border-box",
                  resize: "vertical", fontFamily: "inherit", fontSize: "0.8rem", lineHeight: 1.5 }}
              />
            )}
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-md)", padding: "var(--s3) var(--s4)",
              color: "#ef4444", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading}
            className="btn btn-primary" style={{ width: "100%", padding: "var(--s3)" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--s2)" }}>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Analyzing Repositories & Evidence…
              </span>
            ) : "Analyze Resume"}
          </button>

          {/* How It Works & Classification Scope */}
          <div className="card" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: "var(--s2)", fontSize: "0.86rem" }}>
                🔬 How Verification Works
              </div>
              <div style={{ marginBottom: "var(--s2)" }}>
                <strong>1. Claim Extraction:</strong> AI extracts claimed skills from your resume without omitting non-code competencies.
              </div>
              <div style={{ marginBottom: "var(--s2)" }}>
                <strong>2. Eligibility Classification:</strong> Skills are separated by whether meaningful public repository evidence can reasonably prove proficiency.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", marginTop: "var(--s2)", paddingTop: "var(--s2)", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.76rem", lineHeight: 1.4 }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Verified</span> — meaningful evidence supporting this skill was found in the developer&apos;s public GitHub repositories.
                </div>
                <div style={{ fontSize: "0.76rem", lineHeight: 1.4 }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>✕ Not Found</span> — this skill can be checked using GitHub evidence, but no sufficient public evidence was found.
                </div>
                <div style={{ fontSize: "0.76rem", lineHeight: 1.4 }}>
                  <span style={{ color: "#818cf8", fontWeight: 700 }}>⊘ Not GitHub Verifiable</span> — skills that cannot be reliably verified from public GitHub repository evidence (for example AWS expertise, JWT knowledge, or soft skills). These are not treated as missing.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Results ──────────────────────────────── */}
        {!result && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: 400, flexDirection: "column", gap: "var(--s4)",
            color: "var(--text-muted)", textAlign: "center" }}>
            <div style={{ fontSize: "3rem" }}>📋</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Upload a resume to see verification results
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              Deep repository intelligence scores and proof will appear here
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: 400, flexDirection: "column", gap: "var(--s4)" }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Inspecting repository manifests, Git file trees, and language breakdown…
            </div>
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

            {/* Score summary */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s6)", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s6)", flex: 1, minWidth: 320 }}>
                  <ScoreRing score={result.verification_score} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600,
                      letterSpacing: "0.08em", marginBottom: "var(--s2)" }}>VERIFICATION REPORT</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)",
                      marginBottom: "var(--s3)" }}>
                      {result.username}
                    </div>
                    <div style={{ display: "flex", gap: "var(--s4)", flexWrap: "wrap" }}>
                      {[
                        { label: "GitHub Verified",       count: verified.length + partial.length, color: "#10b981" },
                        { label: "Evidence Not Found",    count: missing.length,                  color: "#ef4444" },
                        { label: "Outside GitHub Scope",  count: outsideScope.length,             color: "#818cf8" },
                      ].map(({ label, count, color }) => (
                        <div key={label}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{count}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                        </div>
                      ))}
                      {result.experience_years && (
                        <div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {result.experience_years}y
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Experience</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "var(--s3)", lineHeight: 1.4 }}>
                      Score is calculated strictly over {result.summary?.verifiable_count || (verified.length + partial.length + missing.length)} GitHub-verifiable skills.
                      {outsideScope.length > 0 && ` ${outsideScope.length} skills outside GitHub scope are excluded from scoring.`}
                    </div>
                    {result.diagnostics && (
                      <div style={{
                        fontSize: "0.72rem", color: "var(--accent-primary)", marginTop: "var(--s2)",
                        padding: "4px 10px", borderRadius: "var(--radius-sm)",
                        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                        display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600,
                      }}>
                        ⚡ Progressive Evidence Scan: {result.diagnostics.repositoriesInspected} repos scanned · {result.diagnostics.skillsVerifiedEarly} verified early ({result.diagnostics.totalAnalysisMs}ms)
                      </div>
                    )}
                  </div>
                </div>

                {/* Download PDF Report Button */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--s2)" }}>
                  <button
                    id="download-pdf-report-btn"
                    className="btn btn-primary"
                    onClick={handleDownloadReport}
                    disabled={downloadingPdf}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                      cursor: downloadingPdf ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {downloadingPdf ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>↓</span> Download PDF Report
                      </>
                    )}
                  </button>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Multi-page official assessment
                  </div>
                </div>
              </div>
            </div>

            {/* Key Strengths (Evidence-Backed) */}
            {result.strengths?.length > 0 && (
              <div className="card" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="card-header" style={{ marginBottom: "var(--s2)" }}>
                  <h3 className="card-title" style={{ color: "#10b981" }}>🌟 Key Technical Strengths</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                  {result.strengths.map((str, i) => (
                    <div key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      ✓ {str}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill verification breakdown */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--s2)" }}>
                <div>
                  <h3 className="card-title">Skill Verification Breakdown</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Click any skill with evidence to view repository proof
                  </div>
                </div>

                {/* Filter buttons */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { id: "all",           label: `All (${result.verification_report?.length || 0})` },
                    { id: "verified",      label: `✓ Verified (${verified.length + partial.length})` },
                    { id: "missing",       label: `✕ Not Found (${missing.length})` },
                    { id: "outside_scope", label: `⊘ Outside Scope (${outsideScope.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSkillFilter(tab.id)}
                      className={`btn btn-sm ${skillFilter === tab.id ? "btn-primary" : "btn-ghost"}`}
                      style={{ fontSize: "0.72rem", padding: "2px 8px", height: "auto" }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "var(--s3)" }}>
                {skillFilter === "all" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
                    {/* Group 1: GitHub Verified */}
                    {verified.length + partial.length > 0 && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.95rem" }}>✓ GitHub Verified</span>
                            <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 99, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700 }}>
                              {verified.length + partial.length}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supported by public repository evidence</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                          {[...verified, ...partial].map((item, i) => (
                            <SkillBadge key={i} item={item} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group 2: GitHub Evidence Not Found */}
                    {missing.length > 0 && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.95rem" }}>✕ GitHub Evidence Not Found</span>
                            <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 700 }}>
                              {missing.length}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No sufficient public GitHub evidence found</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                          {missing.map((item, i) => (
                            <SkillBadge key={i} item={item} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group 3: Outside GitHub Verification Scope */}
                    {outsideScope.length > 0 && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                            <span style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.95rem" }}>⊘ Outside GitHub Verification Scope</span>
                            <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 99, background: "rgba(129,140,248,0.12)", color: "#818cf8", fontWeight: 700 }}>
                              {outsideScope.length}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Excluded from repository scoring · Not treated as missing</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                          {outsideScope.map((item, i) => (
                            <SkillBadge key={i} item={item} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                    {displayedSkills.map((item, i) => (
                      <SkillBadge key={i} item={item} />
                    ))}
                    {displayedSkills.length === 0 && (
                      <div style={{ textAlign: "center", padding: "var(--s4)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        No skills in this category.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Repositories Inspected & Evidence Traced */}
            {result.repositories_analyzed?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Inspected GitHub Repositories</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {result.repositories_analyzed.length} repositories examined
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
                  {result.repositories_analyzed.map((repo, i) => (
                    <div key={i} style={{
                      padding: "var(--s3)", borderRadius: "var(--radius-md)",
                      background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                      display: "flex", flexDirection: "column", gap: "var(--s1)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <a href={repo.html_url} target="_blank" rel="noreferrer"
                          style={{ fontWeight: 600, color: "var(--accent-primary)", fontSize: "0.85rem", textDecoration: "none" }}>
                          {repo.name} ↗
                        </a>
                        {repo.primary_language && (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {repo.primary_language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {repo.description}
                        </div>
                      )}
                      {repo.detected_technologies?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {repo.detected_technologies.slice(0, 5).map((t, idx) => (
                            <span key={idx} style={{
                              fontSize: "0.65rem", padding: "1px 5px", borderRadius: 4,
                              background: "rgba(99,102,241,0.1)", color: "var(--accent-primary)",
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Gaps & Actionable Recommendations */}
            {(result.evidence_gaps?.length > 0 || result.recommendations?.length > 0) && (
              <div className="card" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="card-header" style={{ marginBottom: "var(--s2)" }}>
                  <h3 className="card-title" style={{ color: "#f59e0b" }}>💡 Profile Recommendations & Gaps</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {result.evidence_gaps?.map((gap, i) => (
                    <div key={i}>⚠️ {gap}</div>
                  ))}
                  {result.recommendations?.map((rec, i) => (
                    <div key={i} style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      👉 {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Projects & Specializations */}
            {(result.extracted_projects?.length > 0 || result.specializations?.length > 0) && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Extracted from Resume</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                  {result.specializations?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                        letterSpacing: "0.08em", marginBottom: "var(--s2)" }}>SPECIALIZATIONS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)" }}>
                        {result.specializations.map((s, i) => (
                          <span key={i} style={{
                            padding: "var(--s1) var(--s3)", borderRadius: 99,
                            background: "rgba(99,102,241,0.1)", color: "var(--accent-primary)",
                            fontSize: "0.8rem", fontWeight: 600,
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.extracted_projects?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                        letterSpacing: "0.08em", marginBottom: "var(--s2)" }}>PROJECTS MENTIONED</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)" }}>
                        {result.extracted_projects.map((p, i) => (
                          <span key={i} style={{
                            padding: "var(--s1) var(--s3)", borderRadius: 99,
                            background: "var(--bg-secondary)", color: "var(--text-secondary)",
                            fontSize: "0.8rem", border: "1px solid var(--border-primary)",
                          }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
