// Compare.jsx — Side-by-side developer comparison with Radar chart
import { useState, useEffect } from "react";
import { getAllProfiles } from "../api/profileApi";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const fmt = (n) => {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
};

const normalize = (val, max) => Math.min(100, Math.round((Math.log10(val + 1) / Math.log10(max + 1)) * 100));

const getDimensions = (p) => [
  { dim: "Community",  val: normalize(p.followers, 500000) },
  { dim: "Stars",      val: normalize(p.total_stars, 300000) },
  { dim: "Forks",      val: normalize(p.total_forks, 100000) },
  { dim: "Repos",      val: Math.min(100, Math.round((p.public_repos / 150) * 100)) },
  { dim: "Seniority",  val: Math.min(100, Math.round((p.account_age_days / 5000) * 100)) },
  { dim: "Score",      val: Math.min(100, Math.round((parseFloat(p.popularity_score) / 2000000) * 100)) },
];

const COMPARE_ROWS = [
  { label: "Followers",    key: "followers",        higher: true },
  { label: "Following",    key: "following",         higher: false },
  { label: "Public Repos", key: "public_repos",      higher: true },
  { label: "Total Stars",  key: "total_stars",       higher: true },
  { label: "Total Forks",  key: "total_forks",       higher: true },
  { label: "Gists",        key: "public_gists",      higher: true },
  { label: "Score",        key: "popularity_score",  higher: true, parse: parseFloat },
  { label: "Account Age",  key: "account_age_days",  higher: true, unit: "days" },
];

export default function Compare() {
  const [profiles, setProfiles] = useState([]);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProfiles(1, 50)
      .then((r) => { setProfiles(r.data); if (r.data.length >= 2) { setLeft(r.data[0].username); setRight(r.data[1].username); } })
      .finally(() => setLoading(false));
  }, []);

  const pLeft  = profiles.find((p) => p.username === left);
  const pRight = profiles.find((p) => p.username === right);

  // Build radar data (merged)
  const radarData = pLeft && pRight
    ? getDimensions(pLeft).map((d, i) => ({ dim: d.dim, [pLeft.username]: d.val, [pRight.username]: getDimensions(pRight)[i].val }))
    : [];

  return (
    <div className="page-content">
      <div style={{ marginBottom: "var(--s6)" }}>
        <h1 className="page-title">Compare Developers</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Side-by-side intelligence comparison</p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "var(--s8)" }}>Loading saved profiles...</div>
      ) : profiles.length < 2 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <p className="empty-state-title">Need at least 2 profiles</p>
          <p className="empty-state-desc">Analyze at least 2 developers to compare them.</p>
        </div></div>
      ) : (
        <>
          {/* Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "var(--s4)", alignItems: "center", marginBottom: "var(--s6)" }}>
            <select
              className="input"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              style={{ paddingLeft: "var(--s4)", fontFamily: "inherit" }}
            >
              {profiles.map((p) => <option key={p.username} value={p.username}>@{p.username} — {p.name || p.username}</option>)}
            </select>
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: 700 }}>vs</div>
            <select
              className="input"
              value={right}
              onChange={(e) => setRight(e.target.value)}
              style={{ paddingLeft: "var(--s4)", fontFamily: "inherit" }}
            >
              {profiles.map((p) => <option key={p.username} value={p.username}>@{p.username} — {p.name || p.username}</option>)}
            </select>
          </div>

          {pLeft && pRight && left !== right && (
            <>
              {/* Avatar header */}
              <div className="compare-grid" style={{ marginBottom: "var(--s4)" }}>
                {[pLeft, pRight].map((p) => (
                  <div className="card" key={p.username} style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                    <img src={p.avatar_url} alt={p.username} style={{ width: 56, height: 56, borderRadius: "50%" }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{p.name || p.username}</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", color: "var(--accent-light)" }}>@{p.username}</div>
                      {p.most_used_language && <span className="badge badge-gray" style={{ marginTop: "var(--s1)" }}>{p.most_used_language}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar Chart */}
              <div className="card" style={{ marginBottom: "var(--s4)" }}>
                <div className="section-title">Radar Comparison</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                    <Radar name={pLeft.username}  dataKey={pLeft.username}  stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                    <Radar name={pRight.username} dataKey={pRight.username} stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: "0.8rem" }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "var(--s6)", marginTop: "var(--s3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "0.8rem" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7C3AED" }} />
                    <span style={{ color: "var(--text-secondary)" }}>@{pLeft.username}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "0.8rem" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
                    <span style={{ color: "var(--text-secondary)" }}>@{pRight.username}</span>
                  </div>
                </div>
              </div>

              {/* Stat comparison table */}
              <div className="card">
                <div className="section-title">Stat Comparison</div>
                {COMPARE_ROWS.map((row) => {
                  const lv = row.parse ? row.parse(pLeft[row.key]) : pLeft[row.key] || 0;
                  const rv = row.parse ? row.parse(pRight[row.key]) : pRight[row.key] || 0;
                  const lWins = row.higher ? lv > rv : lv < rv;
                  const rWins = row.higher ? rv > lv : rv < lv;
                  return (
                    <div className="compare-stat-row" key={row.key}>
                      <span className={`compare-val ${lWins ? "winner" : ""}`} style={{ textAlign: "right" }}>
                        {lWins && "👑 "}{fmt(lv)}{row.unit ? ` ${row.unit}` : ""}
                      </span>
                      <span className="compare-label">{row.label}</span>
                      <span className={`compare-val ${rWins ? "winner" : ""}`}>
                        {fmt(rv)}{row.unit ? ` ${row.unit}` : ""}{rWins && " 👑"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {left === right && (
            <div className="alert alert-warning">⚠️ Please select two different developers to compare.</div>
          )}
        </>
      )}
    </div>
  );
}
