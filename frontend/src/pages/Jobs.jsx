import { useState } from "react";
import { matchJob } from "../api/jobApi";
import { extractUsername } from "../utils/github";

const READINESS_META = {
  exceptional: { label: "Exceptional Match", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "⚡" },
  ready:       { label: "Ready to Hire",     color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: "✓" },
  developing:  { label: "Developing",        color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: "📈" },
  not_ready:   { label: "Not Ready",         color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: "✗" },
};

const SKILL_STATUS = {
  verified: { icon: "✓", color: "#10b981", label: "Verified" },
  partial:  { icon: "~", color: "#f59e0b", label: "Partial"  },
  missing:  { icon: "✗", color: "#ef4444", label: "Missing"  },
};

function MatchGauge({ score }) {
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#3b82f6" : score >= 50 ? "#f59e0b" : "#ef4444";
  const angle = -135 + (score / 100) * 270;

  return (
    <div style={{ position: "relative", width: 180, height: 100, flexShrink: 0 }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        {/* Background arc */}
        <path d="M 20 100 A 70 70 0 1 1 160 100" fill="none" stroke="var(--border-primary)" strokeWidth="12" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 20 100 A 70 70 0 1 1 160 100" fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${(score / 100) * 220} 220`}
          style={{ transition: "stroke-dasharray 1.2s ease, stroke 0.5s" }} />
        {/* Needle */}
        <line x1="90" y1="100" x2="90" y2="38"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          transform={`rotate(${angle}, 90, 100)`}
          style={{ transition: "transform 1.2s ease" }} />
        <circle cx="90" cy="100" r="6" fill={color} />
      </svg>
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score)}%</div>
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600,
          letterSpacing: "0.08em" }}>MATCH SCORE</div>
      </div>
    </div>
  );
}

function SkillMatchRow({ item }) {
  const meta = SKILL_STATUS[item.status] || SKILL_STATUS.missing;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)",
      padding: "var(--s2) var(--s3)", borderRadius: "var(--radius-md)",
      background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: `${meta.color}20`, color: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
      }}>{meta.icon}</span>
      <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
        {item.skill}
      </span>
      {item.required && (
        <span style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 600,
          background: "rgba(239,68,68,0.1)", padding: "1px 6px", borderRadius: 99 }}>
          REQUIRED
        </span>
      )}
      <span style={{ fontSize: "0.7rem", color: meta.color, fontWeight: 700 }}>
        {meta.label}
      </span>
    </div>
  );
}

export default function Jobs() {
  const [username, setUsername] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const EXAMPLE_JD = `We are looking for a Senior Frontend Engineer to join our team.

Requirements:
- 4+ years of professional experience
- Expert knowledge of React and TypeScript
- Strong proficiency in Node.js and REST APIs
- Experience with CSS-in-JS and responsive design

Nice to have:
- Docker and Kubernetes experience
- AWS or GCP cloud services
- GraphQL API experience
- Open source contributions`;

  const handleAnalyze = async () => {
    const cleanUsername = extractUsername(username);
    if (!cleanUsername) return setError("Enter a GitHub username.");
    setUsername(cleanUsername); // Update input field to show the clean username
    if (!jobDescription.trim() || jobDescription.trim().length < 50)
      return setError("Job description must be at least 50 characters.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await matchJob(cleanUsername, jobDescription.trim(), jobTitle.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const readinessMeta = result ? READINESS_META[result.hiring_readiness] : null;
  const requiredSkills = result?.skill_match_breakdown?.filter((s) => s.required) || [];
  const optionalSkills = result?.skill_match_breakdown?.filter((s) => !s.required) || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Match Engine</h1>
          <p className="page-subtitle">
            Paste any job description and instantly see how well a developer matches — grounded in real GitHub evidence.
          </p>
        </div>
      </div>

      {/* ── Input section ─────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "var(--s4)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)",
          marginBottom: "var(--s4)" }}>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>
              GITHUB USERNAME
            </label>
            <input className="input" placeholder="e.g. torvalds"
              value={username} onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>
              JOB TITLE (optional)
            </label>
            <input className="input" placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: "var(--s3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "var(--s2)" }}>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em" }}>
              JOB DESCRIPTION
            </label>
            <button onClick={() => setJobDescription(EXAMPLE_JD)}
              style={{ background: "none", border: "none", color: "var(--accent-primary)",
                cursor: "pointer", fontSize: "0.75rem" }}>
              Use example JD
            </button>
          </div>
          <textarea className="input" placeholder="Paste the full job description here..."
            value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            style={{ width: "100%", minHeight: 180, boxSizing: "border-box",
              resize: "vertical", fontFamily: "inherit", fontSize: "0.8rem", lineHeight: 1.6 }} />
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "var(--s1)",
            textAlign: "right" }}>
            {jobDescription.length.toLocaleString()} / 15,000 chars
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: "var(--s3)", padding: "var(--s2) var(--s3)",
            background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-md)",
            color: "#ef4444", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}

        <button onClick={handleAnalyze} disabled={loading}
          className="btn btn-primary" style={{ width: "100%", padding: "var(--s3)" }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--s2)" }}>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              Extracting requirements & matching…
            </span>
          ) : "Analyze Job Match"}
        </button>
      </div>

      {/* ── Loading ────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          height: 260, flexDirection: "column", gap: "var(--s4)" }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
          <div style={{ color: "var(--text-secondary)" }}>AI is extracting job requirements…</div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

          {/* Top summary */}
          <div className="card" style={{ background:
            `linear-gradient(135deg, ${readinessMeta.color}08, transparent)`,
            border: `1px solid ${readinessMeta.color}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s6)" }}>
              <MatchGauge score={result.match_score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                  letterSpacing: "0.08em", marginBottom: "var(--s2)" }}>JOB MATCH ANALYSIS</div>
                {result.job_title && (
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)",
                    marginBottom: "var(--s2)" }}>{result.job_title}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)",
                  marginBottom: "var(--s3)" }}>
                  <span style={{ fontSize: "1.5rem" }}>{readinessMeta.icon}</span>
                  <span style={{
                    padding: "var(--s1) var(--s3)", borderRadius: 99,
                    background: readinessMeta.bg, color: readinessMeta.color,
                    fontWeight: 700, fontSize: "0.875rem",
                  }}>
                    {readinessMeta.label}
                  </span>
                  {result.cached && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)",
                      background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: 99,
                      border: "1px solid var(--border-primary)" }}>⚡ Cached</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "var(--s4)" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>REQUIRED</div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {requiredSkills.filter((s) => s.status !== "missing").length}/{requiredSkills.length} met
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>NICE-TO-HAVE</div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {optionalSkills.filter((s) => s.status !== "missing").length}/{optionalSkills.length} met
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills + Strengths/Gaps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
            {/* Required skills */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Required Skills</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                {requiredSkills.length === 0
                  ? <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No required skills extracted</div>
                  : requiredSkills.map((s, i) => <SkillMatchRow key={i} item={s} />)
                }
              </div>

              {optionalSkills.length > 0 && (
                <>
                  <div style={{ borderTop: "1px solid var(--border-primary)",
                    margin: "var(--s4) 0", paddingTop: "var(--s3)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                      letterSpacing: "0.08em", marginBottom: "var(--s2)" }}>NICE TO HAVE</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                    {optionalSkills.map((s, i) => <SkillMatchRow key={i} item={{ ...s, required: false }} />)}
                  </div>
                </>
              )}
            </div>

            {/* Strengths + Gaps + Recommendations */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
              {result.strengths?.length > 0 && (
                <div className="card" style={{ background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.15)" }}>
                  <div className="card-header">
                    <h3 className="card-title" style={{ color: "#10b981" }}>✓ Strengths</h3>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "var(--s5)", display: "flex",
                    flexDirection: "column", gap: "var(--s2)" }}>
                    {result.strengths.map((s, i) => (
                      <li key={i} style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.gaps?.length > 0 && (
                <div className="card" style={{ background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="card-header">
                    <h3 className="card-title" style={{ color: "#ef4444" }}>✗ Gaps</h3>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "var(--s5)", display: "flex",
                    flexDirection: "column", gap: "var(--s2)" }}>
                    {result.gaps.map((g, i) => (
                      <li key={i} style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recommendations</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                    {result.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "var(--s2)", alignItems: "flex-start" }}>
                        <span style={{ color: "var(--accent-primary)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {!result && !loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          height: 200, flexDirection: "column", gap: "var(--s3)", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem" }}>🎯</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Paste a job description and enter a GitHub username to see the match
          </div>
        </div>
      )}
    </div>
  );
}
