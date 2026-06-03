import { useState } from "react";
import { getCareerPrediction, refreshCareerPrediction } from "../api/careerApi";
import { extractUsername } from "../utils/github";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Tooltip, ResponsiveContainer,
} from "recharts";

const LEVELS = ["beginner", "junior", "intermediate", "advanced", "expert"];

const LEVEL_META = {
  beginner:     { label: "Beginner",     color: "#94a3b8", emoji: "🌱" },
  junior:       { label: "Junior",       color: "#60a5fa", emoji: "🔵" },
  intermediate: { label: "Intermediate", color: "#a78bfa", emoji: "🟣" },
  advanced:     { label: "Advanced",     color: "#f59e0b", emoji: "🟡" },
  expert:       { label: "Expert",       color: "#10b981", emoji: "🟢" },
};

const POTENTIAL_META = {
  low:         { label: "Low",         color: "#94a3b8", icon: "📉" },
  moderate:    { label: "Moderate",    color: "#60a5fa", icon: "📊" },
  high:        { label: "High",        color: "#f59e0b", icon: "🚀" },
  exceptional: { label: "Exceptional", color: "#10b981", icon: "⚡" },
};

function LevelTimeline({ currentLevel, predictedLevel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {LEVELS.map((level, idx) => {
        const meta = LEVEL_META[level];
        const isCurrent = level === currentLevel;
        const isPredicted = level === predictedLevel;
        const isPast = LEVELS.indexOf(level) < LEVELS.indexOf(currentLevel);
        const isLast = idx === LEVELS.length - 1;

        return (
          <div key={level} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: isCurrent ? 48 : isPredicted ? 40 : 32,
                height: isCurrent ? 48 : isPredicted ? 40 : 32,
                borderRadius: "50%",
                background: isCurrent
                  ? meta.color
                  : isPast
                  ? "var(--border-secondary)"
                  : isPredicted
                  ? `${meta.color}40`
                  : "var(--bg-secondary)",
                border: `2px solid ${isCurrent || isPast ? meta.color : isPredicted ? meta.color : "var(--border-primary)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCurrent ? "1.2rem" : "0.9rem",
                transition: "all 0.3s",
                boxShadow: isCurrent ? `0 0 0 4px ${meta.color}25` : "none",
              }}>
                {meta.emoji}
              </div>
              <div style={{
                marginTop: "var(--s2)", fontSize: "0.65rem", fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? meta.color : "var(--text-muted)",
                textAlign: "center", letterSpacing: "0.04em",
              }}>
                {meta.label.toUpperCase()}
              </div>
              {isCurrent && (
                <div style={{
                  fontSize: "0.6rem", color: meta.color, fontWeight: 700,
                  background: `${meta.color}20`, padding: "1px 6px", borderRadius: 99,
                  marginTop: 2,
                }}>YOU</div>
              )}
              {isPredicted && !isCurrent && (
                <div style={{
                  fontSize: "0.6rem", color: meta.color, fontWeight: 700,
                  background: `${meta.color}20`, padding: "1px 6px", borderRadius: 99,
                  marginTop: 2,
                }}>NEXT</div>
              )}
            </div>
            {!isLast && (
              <div style={{
                height: 2, flex: 1,
                background: isPast || isCurrent
                  ? LEVEL_META[currentLevel].color
                  : "var(--border-primary)",
                margin: "-20px var(--s1) 0",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GrowthRadar({ factorBreakdown }) {
  const data = Object.entries(factorBreakdown).map(([, val]) => ({
    subject: val.label.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    score: Math.round(val.score),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="var(--border-primary)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-card)", border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "var(--text-primary)",
          }}
          formatter={(val) => [`${val}%`, "Score"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default function Career() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [cached, setCached] = useState(false);

  const handleFetch = async (forceRefresh = false) => {
    const cleanUsername = extractUsername(username);
    if (!cleanUsername) return setError("Enter a GitHub username.");
    setUsername(cleanUsername); // Update input field to show the clean username
    setLoading(true);
    setError(null);
    try {
      const res = forceRefresh
        ? await refreshCareerPrediction(cleanUsername)
        : await getCareerPrediction(cleanUsername);
      setResult(res.data);
      setCached(res.cached);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load career prediction.");
    } finally {
      setLoading(false);
    }
  };

  const currentMeta  = result ? LEVEL_META[result.current_level]  : null;
  const potentialMeta = result ? POTENTIAL_META[result.growth_potential] : null;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Career Growth Intelligence</h1>
          <p className="page-subtitle">
            Predict developer trajectory using GitHub activity patterns. Data-driven, not guesswork.
          </p>
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "var(--s4)" }}>
        <div style={{ display: "flex", gap: "var(--s3)", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>
              GITHUB USERNAME
            </label>
            <input className="input" placeholder="e.g. torvalds"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => handleFetch()} disabled={loading} className="btn btn-primary"
            style={{ padding: "var(--s3) var(--s6)", whiteSpace: "nowrap" }}>
            {loading ? "Predicting…" : "Predict Growth"}
          </button>
          {result && (
            <button onClick={() => handleFetch(true)} disabled={loading} className="btn btn-ghost"
              style={{ whiteSpace: "nowrap" }}>
              ↺ Refresh
            </button>
          )}
        </div>
        {error && (
          <div style={{ marginTop: "var(--s3)", padding: "var(--s2) var(--s3)",
            background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-md)",
            color: "#ef4444", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Loading ────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          height: 300, flexDirection: "column", gap: "var(--s4)" }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
          <div style={{ color: "var(--text-secondary)" }}>Computing career trajectory…</div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {!result && !loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          height: 300, flexDirection: "column", gap: "var(--s4)", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "3rem" }}>📈</div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Enter a GitHub username to predict career growth
          </div>
          <div style={{ fontSize: "0.875rem", textAlign: "center", maxWidth: 400 }}>
            Analyzes repository count, language diversity, community influence, project complexity, and open source impact.
          </div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

          {/* Cache notice */}
          {cached && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)",
              fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>⚡ Cached result</span>
              <button onClick={() => handleFetch(true)}
                style={{ background: "none", border: "none", color: "var(--accent-primary)",
                  cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>
                Refresh
              </button>
            </div>
          )}

          {/* Top row: level cards + potential */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s4)" }}>
            {/* Current Level */}
            <div className="card" style={{ textAlign: "center", background:
              `linear-gradient(135deg, ${currentMeta.color}15, transparent)`,
              border: `1px solid ${currentMeta.color}30` }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                letterSpacing: "0.08em", marginBottom: "var(--s3)" }}>CURRENT LEVEL</div>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--s2)" }}>{currentMeta.emoji}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: currentMeta.color }}>
                {currentMeta.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
                Growth Score: <strong style={{ color: "var(--text-primary)" }}>{result.growth_score}%</strong>
              </div>
            </div>

            {/* Predicted Level */}
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                letterSpacing: "0.08em", marginBottom: "var(--s3)" }}>PREDICTED NEXT</div>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--s2)" }}>
                {LEVEL_META[result.predicted_level].emoji}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: LEVEL_META[result.predicted_level].color }}>
                {LEVEL_META[result.predicted_level].label}
              </div>
              {result.timeline_months && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
                  ≈ <strong style={{ color: "var(--text-primary)" }}>{result.timeline_months} months</strong>
                </div>
              )}
            </div>

            {/* Growth Potential */}
            <div className="card" style={{ textAlign: "center", background:
              `linear-gradient(135deg, ${potentialMeta.color}10, transparent)`,
              border: `1px solid ${potentialMeta.color}25` }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                letterSpacing: "0.08em", marginBottom: "var(--s3)" }}>GROWTH POTENTIAL</div>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--s2)" }}>{potentialMeta.icon}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: potentialMeta.color }}>
                {potentialMeta.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "var(--s2)" }}>
                Growth trajectory
              </div>
            </div>
          </div>

          {/* Level Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Developer Level Roadmap</h3>
            </div>
            <div style={{ padding: "var(--s4) var(--s2)" }}>
              <LevelTimeline currentLevel={result.current_level} predictedLevel={result.predicted_level} />
            </div>
          </div>

          {/* Factor breakdown: Radar + bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
            {/* Radar Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Factor Analysis</h3>
              </div>
              <GrowthRadar factorBreakdown={result.factor_breakdown} />
            </div>

            {/* Score bars */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Score Breakdown</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
                {Object.entries(result.factor_breakdown).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      marginBottom: "var(--s1)", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {val.label}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {Math.round(val.score)}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99,
                        width: `${val.score}%`,
                        background: val.score >= 70 ? "#10b981" : val.score >= 45 ? "#6366f1" : "#f59e0b",
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {val.raw_label || val.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Growth Recommendations</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Priority order</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: "var(--s3)", alignItems: "flex-start" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: "var(--accent-primary)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 700,
                    }}>{i + 1}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)",
                      lineHeight: 1.5, paddingTop: 2 }}>
                      {rec}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
