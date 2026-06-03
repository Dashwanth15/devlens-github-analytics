// ScoreBreakdown.jsx — Developer Intelligence Score with dimension bars
import { useEffect, useState } from "react";

const DIMENSIONS = [
  {
    key: "community",
    label: "Community Influence",
    desc: "Followers & social reach",
    calc: (p) => Math.min(100, (Math.log10(p.followers + 1) / Math.log10(500000)) * 100),
  },
  {
    key: "impact",
    label: "Open Source Impact",
    desc: "Stars & forks earned",
    calc: (p) => Math.min(100, (Math.log10(p.total_stars + 1) / Math.log10(300000)) * 100),
  },
  {
    key: "output",
    label: "Code Output",
    desc: "Repositories & gists",
    calc: (p) => Math.min(100, (p.public_repos / 150) * 100),
  },
  {
    key: "seniority",
    label: "Seniority Signal",
    desc: "Account age × activity",
    calc: (p) => Math.min(100, (p.account_age_days / 5000) * 100),
  },
  {
    key: "collaboration",
    label: "Collaboration",
    desc: "Forks earned from community",
    calc: (p) => Math.min(100, (Math.log10(p.total_forks + 1) / Math.log10(100000)) * 100),
  },
  {
    key: "breadth",
    label: "Tech Breadth",
    desc: "Language diversity",
    calc: (p, langCount) => Math.min(100, (langCount / 10) * 100),
  },
];

const getScoreLabel = (score) => {
  if (score >= 900) return { label: "Legendary", color: "#F59E0B" };
  if (score >= 700) return { label: "Expert", color: "#10B981" };
  if (score >= 500) return { label: "Senior", color: "var(--accent-light)" };
  if (score >= 300) return { label: "Mid-level", color: "#38BDF8" };
  return { label: "Junior", color: "var(--text-muted)" };
};

const normalizeScore = (rawScore) => {
  const maxScore = 2000000;
  return Math.min(1000, Math.round((Math.log10(rawScore + 1) / Math.log10(maxScore)) * 1000));
};

export default function ScoreBreakdown({ profile, langCount = 1 }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const score = normalizeScore(parseFloat(profile.popularity_score));
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const pct = (score / 1000) * 100;

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s4)", marginBottom: "var(--s5)" }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
            Intelligence Score
          </div>
          <div className="score-display">
            <span className="score-value">{score.toLocaleString()}</span>
            <span className="score-max">/ 1000</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
            <span className="badge badge-violet" style={{ color: scoreColor, borderColor: scoreColor + "40" }}>
              {scoreLabel}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Based on GitHub activity
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--s1)" }}>Raw Score</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {Number(profile.popularity_score).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="score-bar-wrap">
        <div className="score-bar-track">
          <div
            className="score-bar-fill"
            style={{ width: animated ? `${pct}%` : "0%" }}
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
          Dimension Breakdown
        </div>
        {DIMENSIONS.map((dim) => {
          const val = Math.round(dim.calc(profile, langCount));
          return (
            <div className="score-dimension" key={dim.key}>
              <div className="score-dim-label">{dim.label}</div>
              <div className="score-dim-bar">
                <div
                  className="score-dim-fill"
                  style={{
                    width: animated ? `${val}%` : "0%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                  }}
                />
              </div>
              <div className="score-dim-pct">{val}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

