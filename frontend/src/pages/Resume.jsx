import { useState, useCallback, useRef } from "react";
import { analyzeResumeFile, analyzeResumeText } from "../api/resumeApi";
import { extractUsername } from "../utils/github";

// ── Status badge helpers ─────────────────────────────────────────────────────
const STATUS_META = {
  verified:    { label: "Verified",              color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✓" },
  limited:     { label: "Verified",              color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✓" }, // legacy
  not_found:   { label: "Not Found",             color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "✗" },
  non_github:  { label: "Not GitHub Verifiable", color: "#6366f1", bg: "rgba(99,102,241,0.12)",  icon: "⊘" },
};

function SkillBadge({ item }) {
  const meta = STATUS_META[item.status] || STATUS_META.not_found;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--s3)",
      padding: "var(--s3) var(--s4)", borderRadius: "var(--radius-lg)",
      background: "var(--bg-card)", border: "1px solid var(--border-primary)",
      transition: "all 0.2s",
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: "50%",
        background: meta.bg, color: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
      }}>
        {meta.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>
          {item.skill}
        </div>
        {item.evidence?.length > 0 && (
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.evidence[0]}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: meta.color }}>
          {item.confidence}%
        </div>
        <div style={{
          fontSize: "0.65rem", padding: "1px 6px", borderRadius: 99,
          background: meta.bg, color: meta.color, fontWeight: 600,
        }}>
          {meta.label}
        </div>
      </div>
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
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
          {Math.round(score)}%
        </div>
        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
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
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleAnalyze = async () => {
    const cleanUsername = extractUsername(username);
    if (!cleanUsername) return setError("Enter a GitHub username.");
    setUsername(cleanUsername); // Update input field to show the clean username
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
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Treat legacy 'limited' results as verified
  const verified      = result?.verification_report?.filter((r) => r.status === "verified" || r.status === "limited") || [];
  const not_found     = result?.verification_report?.filter((r) => r.status === "not_found") || [];
  const nonVerifiable = result?.non_verifiable_skills || [];

  return (
    <div className="page-content">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Resume Verification</h1>
          <p className="page-subtitle">
            Cross-reference resume claims against real GitHub activity. No more keyword inflation.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "var(--s6)", alignItems: "start" }}>

        {/* ── LEFT PANEL: Input ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

          {/* GitHub username */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">GitHub Profile</h3>
            </div>
            <input
              className="input"
              placeholder="e.g. torvalds or github.com/username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
              💡 You can paste a full GitHub URL like <code style={{ color: "var(--accent-primary)" }}>github.com/Dashwanth15</code>
            </div>
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
                Analyzing…
              </span>
            ) : "Analyze Resume"}
          </button>

          {/* Tips */}
          <div className="card" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "var(--s2)" }}>
                💡 How it works
              </div>
              <div>1. AI extracts claimed skills from your resume</div>
              <div>2. Each skill is matched against GitHub languages, repo names, and descriptions</div>
              <div>3. Results are split into 3 categories:</div>
              <div style={{ marginTop: "var(--s1)", paddingLeft: "var(--s3)" }}>
                <div><span style={{ color: "#10b981", fontWeight: 700 }}>✓ Verified</span> — proven in GitHub repos</div>
                <div><span style={{ color: "#6366f1", fontWeight: 700 }}>⊘ Not GitHub Verifiable</span> — real skills (AWS, JWT, AJAX…) that GitHub can't surface</div>
                <div><span style={{ color: "#ef4444", fontWeight: 700 }}>✗ Not Found</span> — claimed but no GitHub evidence</div>
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
              Skill confidence scores will appear here
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: 400, flexDirection: "column", gap: "var(--s4)" }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ color: "var(--text-secondary)" }}>Extracting skills and matching evidence…</div>
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

            {/* Score summary */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s6)" }}>
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
                      { label: "Verified",          count: verified.length,      color: "#10b981" },
                      { label: "Not Found",          count: not_found.length,     color: "#ef4444" },
                      { label: "Not GitHub Verifiable", count: nonVerifiable.length, color: "#6366f1" },
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
                </div>
              </div>
            </div>

            {/* Skill breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Skill Verification Breakdown</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {result.verification_report?.length || 0} skills analyzed
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                {result.verification_report?.map((item, i) => (
                  <SkillBadge key={i} item={item} />
                ))}
              </div>
            </div>

            {/* Non-verifiable skills — real skills but not detectable via GitHub */}
            {nonVerifiable.length > 0 && (
              <div className="card" style={{
                background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="card-header">
                  <h3 className="card-title" style={{ color: "#818cf8" }}>⊘ Not GitHub Verifiable</h3>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "var(--s3)", lineHeight: 1.6 }}>
                  These are <strong style={{ color: "var(--text-secondary)" }}>legitimate skills</strong> that cannot be verified through GitHub repositories — they are protocols, cloud platforms, auth mechanisms, or CS concepts that don't appear as code languages. Recruiters should verify them through interviews or certifications.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)" }}>
                  {nonVerifiable.map((skill, i) => (
                    <span key={i} style={{
                      padding: "var(--s1) var(--s3)", borderRadius: 99,
                      background: "rgba(99,102,241,0.1)", color: "#818cf8",
                      fontSize: "0.8rem", fontWeight: 600,
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}>⊘ {skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing evidence */}
            {result.missing_evidence?.length > 0 && (
              <div className="card" style={{
                background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="card-header">
                  <h3 className="card-title" style={{ color: "#ef4444" }}>⚠ Missing Evidence</h3>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "var(--s3)" }}>
                  These skills are on the resume but have no GitHub evidence. Candidate should add projects demonstrating them.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)" }}>
                  {result.missing_evidence.map((skill, i) => (
                    <span key={i} style={{
                      padding: "var(--s1) var(--s3)", borderRadius: 99,
                      background: "rgba(239,68,68,0.1)", color: "#ef4444",
                      fontSize: "0.8rem", fontWeight: 600,
                    }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted info */}
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
