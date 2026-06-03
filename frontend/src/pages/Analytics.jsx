// Analytics.jsx — Aggregated Developer Intelligence across all saved profiles
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProfiles } from "../api/profileApi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const TOOLTIP = {
  background: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#FAFAFA",
  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
};

const DONUT_COLORS = ["#7C3AED","#8B5CF6","#A78BFA","#6D28D9","#9333EA","#C4B5FD","#4C1D95","#7E22CE"];

const clamp  = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));
const logNorm = (v, scale) => clamp((Math.log10(v + 1) / Math.log10(scale)) * 100);
const normalizeScore = (raw) =>
  Math.min(1000, Math.round((Math.log10(raw + 1) / Math.log10(2000000)) * 1000));

const getScoreLabel = (score) => {
  if (score >= 900) return { label: "Legendary", color: "#F59E0B" };
  if (score >= 700) return { label: "Expert",    color: "#10B981" };
  if (score >= 500) return { label: "Senior",    color: "#A78BFA" };
  if (score >= 300) return { label: "Mid-Level", color: "#38BDF8" };
  if (score >= 150) return { label: "Rising",    color: "#7C3AED" };
  return               { label: "Junior",    color: "#71717A" };
};

export default function Analytics() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    getAllProfiles(1, 100)
      .then((r) => setProfiles(r.data || []))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setAnimated(true), 200);
      });
  }, []);

  if (loading) return (
    <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "var(--s16)", flexDirection: "column", gap: "var(--s4)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading intelligence data…</span>
    </div>
  );

  if (profiles.length === 0) return (
    <div className="page-content">
      <div className="card" style={{ textAlign: "center", padding: "var(--s16)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "var(--s4)" }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "var(--s3)" }}>No profiles analyzed yet</div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--s6)" }}>
          Analyze some developers from the Dashboard to see aggregated intelligence here.
        </p>
        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  );

  // ── Aggregated Computations ──────────────────────────────────────
  const totalProfiles  = profiles.length;
  const totalStars     = profiles.reduce((s, p) => s + (p.total_stars  || 0), 0);
  const totalRepos     = profiles.reduce((s, p) => s + (p.public_repos || 0), 0);
  const totalFollowers = profiles.reduce((s, p) => s + (p.followers    || 0), 0);
  const avgFollowers   = Math.round(totalFollowers / totalProfiles);
  const avgStars       = Math.round(totalStars / totalProfiles);
  const avgRepos       = Math.round(totalRepos / totalProfiles);

  // Language frequency across all profiles
  const langFreq = profiles.reduce((acc, p) => {
    if (p.most_used_language) acc[p.most_used_language] = (acc[p.most_used_language] || 0) + 1;
    return acc;
  }, {});
  const sortedLangs = Object.entries(langFreq).sort((a, b) => b[1] - a[1]);
  const top5Langs   = sortedLangs.slice(0, 5);
  const otherCount  = sortedLangs.slice(5).reduce((s, [, c]) => s + c, 0);
  const donutData   = [
    ...top5Langs.map(([name, value]) => ({ name, value })),
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount }] : []),
  ];
  const uniqueLangs = sortedLangs.length;

  // Score distribution
  const scoreBuckets = { Junior: 0, Rising: 0, "Mid-Level": 0, Senior: 0, Expert: 0, Legendary: 0 };
  profiles.forEach((p) => {
    const s = normalizeScore(parseFloat(p.popularity_score || 0));
    const { label } = getScoreLabel(s);
    scoreBuckets[label] = (scoreBuckets[label] || 0) + 1;
  });
  const scoreDistData = Object.entries(scoreBuckets)
    .filter(([, v]) => v > 0)
    .map(([name, count]) => ({ name, count }));

  // Top 10 by score
  const topByScore = [...profiles]
    .sort((a, b) => parseFloat(b.popularity_score) - parseFloat(a.popularity_score))
    .slice(0, 8)
    .map((p) => ({
      name:  p.username,
      score: normalizeScore(parseFloat(p.popularity_score || 0)),
    }));

  // Top 10 by stars
  const topByStars = [...profiles]
    .sort((a, b) => (b.total_stars || 0) - (a.total_stars || 0))
    .slice(0, 8)
    .map((p) => ({ name: p.username, stars: p.total_stars || 0 }));

  // Aggregate radar for the "average" profile in the database
  const avgRadar = [
    { axis: "Community",   value: clamp(logNorm(avgFollowers, 500000)) },
    { axis: "Open Source", value: clamp(logNorm(avgStars, 1000)) },
    { axis: "Output",      value: clamp((avgRepos / 100) * 100) },
    { axis: "Diversity",   value: clamp((uniqueLangs / 12) * 100) },
    { axis: "Reach",       value: clamp((avgFollowers / 1000) * 100) },
    { axis: "Scale",       value: clamp((totalProfiles / 50) * 100) },
  ];

  const SCORE_COLORS = {
    Junior: "#71717A", Rising: "#7C3AED", "Mid-Level": "#38BDF8",
    Senior: "#A78BFA", Expert: "#10B981", Legendary: "#F59E0B",
  };

  const topLang = sortedLangs[0]?.[0] || "N/A";

  return (
    <div className="page-content">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "var(--s8)" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
          Intelligence Center
        </div>
        <h1 className="page-title" style={{ marginBottom: "var(--s2)" }}>Analytics</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Aggregated developer intelligence across{" "}
          <strong style={{ color: "var(--text-primary)" }}>{totalProfiles}</strong> analyzed profiles
        </p>
      </div>

      {/* ── Executive KPI Strip ─────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "var(--s3)",
        marginBottom: "var(--s6)",
      }}>
        {[
          { label: "Profiles Tracked",   value: totalProfiles.toLocaleString(),         accent: false },
          { label: "Total Stars",         value: totalStars.toLocaleString(),             accent: true  },
          { label: "Total Repos",         value: totalRepos.toLocaleString(),             accent: false },
          { label: "Avg Stars / Dev",     value: avgStars.toLocaleString(),               accent: false },
          { label: "Avg Followers",       value: avgFollowers.toLocaleString(),           accent: false },
          { label: "Language Diversity",  value: uniqueLangs,                             accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card fade-up" style={{ padding: "var(--s4)" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
              {label}
            </div>
            <div style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: accent ? "var(--accent-light)" : "var(--text-primary)",
              lineHeight: 1,
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Radar + Score Distribution ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)", marginBottom: "var(--s4)" }}>

        {/* Database Radar */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
            Database Health Radar
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Average profile signal across {totalProfiles} developers
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={avgRadar} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="#27272A" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#A1A1AA", fontSize: 11, fontFamily: "Inter" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#52525B", fontSize: 9 }} tickCount={4} stroke="#27272A" />
              <Radar name="Database Avg" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.12} strokeWidth={2} dot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }} />
              <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}/100`, "Signal"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Tier Distribution */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
            Developer Tier Distribution
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            How many profiles fall into each intelligence tier
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreDistData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(124,58,237,0.05)" }} formatter={(v) => [v, "Profiles"]} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistData.map((entry) => (
                  <Cell key={entry.name} fill={SCORE_COLORS[entry.name] || "#7C3AED"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Language Portfolio Donut + Leaderboards ──────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s4)", marginBottom: "var(--s4)" }}>

        {/* Language Donut */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Language Portfolio
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "var(--s3)" }}>
            Most-used language per developer
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="42%" innerRadius="48%" outerRadius="68%" paddingAngle={3} dataKey="value" strokeWidth={0}>
                {donutData.map((entry, i) => (
                  <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} formatter={(v, name) => [`${v} devs`, name]} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: 8 }} formatter={(v) => <span style={{ color: "#A1A1AA" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Leaderboard */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
            Intelligence Score Board
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            {topByScore.map((p, i) => {
              const { color } = getScoreLabel(p.score);
              const pct = clamp((p.score / 1000) * 100);
              return (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 16 }}>#{i + 1}</span>
                      <Link to={`/profiles/${p.name}`} style={{ color: "var(--accent-light)", fontWeight: 500 }}>{p.name}</Link>
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color }}>{p.score}</span>
                  </div>
                  <div style={{ height: 4, background: "#1F1F23", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99, background: color,
                      width: animated ? `${pct}%` : "0%",
                      transition: `width ${0.8 + i * 0.07}s cubic-bezier(0.4,0,0.2,1)`,
                      opacity: 0.8,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stars Leaderboard */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
            Stars Leaderboard
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            {topByStars.map((p, i) => {
              const maxStars = topByStars[0]?.stars || 1;
              const pct = clamp((p.stars / maxStars) * 100);
              return (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 16 }}>#{i + 1}</span>
                      <Link to={`/profiles/${p.name}`} style={{ color: "var(--accent-light)", fontWeight: 500 }}>{p.name}</Link>
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#F59E0B" }}>⭐ {p.stars.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: "#1F1F23", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      background: "linear-gradient(90deg, #B45309, #F59E0B)",
                      width: animated ? `${pct}%` : "0%",
                      transition: `width ${0.8 + i * 0.07}s cubic-bezier(0.4,0,0.2,1)`,
                      opacity: 0.85,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Database Intelligence Summary ────────────────────────── */}
      <div style={{
        background: "linear-gradient(140deg, #18181B 0%, #1C1028 100%)",
        border: "1px solid #2D1F4E",
        borderLeft: "4px solid #7C3AED",
        borderRadius: "var(--r-xl)",
        padding: "28px 36px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s5)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>⬡</div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Database Intelligence Summary</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Aggregated signal across all {totalProfiles} analyzed profiles</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s6)" }}>
          {[
            {
              label: "Platform Insight",
              color: "#A78BFA",
              items: [
                `${totalProfiles} developer profiles in the intelligence database`,
                `${uniqueLangs} distinct programming languages tracked`,
                `${totalStars.toLocaleString()} cumulative stars across all profiles`,
                `${totalRepos.toLocaleString()} total repositories being monitored`,
              ],
            },
            {
              label: "Ecosystem Patterns",
              color: "#10B981",
              items: [
                `${topLang} is the dominant primary language in this database`,
                `Average developer maintains ${avgRepos} public repositories`,
                `Average community size is ${avgFollowers} followers per profile`,
                `${scoreDistData.length} distinct intelligence tiers represented`,
              ],
            },
            {
              label: "Recommendations",
              color: "#38BDF8",
              items: [
                "Analyze developers with 50+ stars for deeper pattern insights",
                "Compare across similar seniority tiers for fair benchmarking",
                "Add profiles with TypeScript for modern web ecosystem signals",
                "Track the same developer over time to measure growth velocity",
              ],
            },
          ].map(({ label, color, items }) => (
            <div key={label}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: "var(--s4)" }}>
                {label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "var(--s2)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    <span style={{ color, flexShrink: 0, marginTop: 3, fontSize: "0.65rem" }}>›</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
