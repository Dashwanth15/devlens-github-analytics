// ProfileDetail.jsx — Full profile view from Profiles table
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfileByUsername, refreshProfile } from "../api/profileApi";
import ProfileCard from "../components/ProfileCard";
import StatsGrid from "../components/StatsGrid";
import ScoreBreakdown from "../components/ScoreBreakdown";
import LanguageChart from "../components/LanguageChart";
import RepoList from "../components/RepoList";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { SkeletonProfileHero, SkeletonStatGrid, SkeletonCard } from "../components/Skeleton";

// ── Language classification (same as AnalyticsDashboard) ────────
const FRONTEND = new Set(["javascript","typescript","html","css","vue","svelte","scss","sass"]);
const BACKEND  = new Set(["python","java","go","php","ruby","c#","kotlin","scala","dart","swift","elixir"]);
const SYSTEMS  = new Set(["c","c++","rust","assembly","zig","nim","fortran"]);
const clamp    = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));
const logNorm  = (v, scale) => clamp((Math.log10(v + 1) / Math.log10(scale)) * 100);
const normScore = (raw) => Math.min(1000, Math.round((Math.log10(raw + 1) / Math.log10(2000000)) * 1000));
const scoreTier = (s) => {
  if (s >= 900) return { label: "Legendary", color: "#F59E0B" };
  if (s >= 700) return { label: "Expert",    color: "#10B981" };
  if (s >= 500) return { label: "Senior",    color: "#A78BFA" };
  if (s >= 300) return { label: "Mid-Level", color: "#38BDF8" };
  if (s >= 150) return { label: "Rising",    color: "#7C3AED" };
  return           { label: "Junior",    color: "#71717A" };
};

// ── Mini AI Summary card ─────────────────────────────────────────
function MiniAIReport({ profile, langDist, repositories }) {
  const ownRepos   = (repositories || []).filter(r => !r.is_fork);
  const totalOwn   = ownRepos.length || 1;
  const sortedL    = Object.entries(langDist).sort((a, b) => b[1] - a[1]);
  const topLang    = sortedL[0]?.[0] || profile.most_used_language || "unknown";
  const uniqueCount = sortedL.length;
  const frontCount  = ownRepos.filter(r => FRONTEND.has((r.language||"").toLowerCase())).length;
  const backCount   = ownRepos.filter(r => BACKEND.has((r.language||"").toLowerCase())).length;
  const sysCount    = ownRepos.filter(r => SYSTEMS.has((r.language||"").toLowerCase())).length;

  const archetype = (() => {
    const fPct = (frontCount / totalOwn) * 150;
    const bPct = (backCount  / totalOwn) * 150;
    const sPct = (sysCount   / totalOwn) * 200;
    if (fPct > 40 && bPct > 40) return "Full-Stack Engineer";
    if (fPct > 35) return "Frontend Engineer";
    if (bPct > 35) return "Backend Engineer";
    if (sPct > 25) return "Systems Engineer";
    if (topLang.toLowerCase() === "python") return "Data / ML Engineer";
    return "Software Engineer";
  })();

  const score = normScore(parseFloat(profile.popularity_score || 0));
  const { label: tier, color: tierColor } = scoreTier(score);
  const accountYears = ((profile.account_age_days || 0) / 365).toFixed(1);
  const topThree = sortedL.slice(0, 3).map(([l]) => l).join(", ") || topLang;

  const strengths = [];
  if (uniqueCount >= 3) strengths.push(`Diverse tech stack across ${uniqueCount} languages`);
  if ((profile.total_stars || 0) > 0) strengths.push(`${profile.total_stars} community stars earned`);
  if (ownRepos.length >= 5) strengths.push(`${ownRepos.length} active non-fork projects`);
  if (frontCount > 0 && backCount > 0) strengths.push("Full-stack exposure in portfolio");
  if (strengths.length === 0) strengths.push("GitHub profile actively building");

  return (
    <div style={{
      background: "linear-gradient(135deg, #18181B, #1C1028)",
      border: "1px solid #2D1F4E",
      borderLeft: "3px solid #7C3AED",
      borderRadius: "var(--r-lg)",
      padding: "var(--s4) var(--s5)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
          <span style={{ fontSize: "0.9rem" }}>⬡</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A78BFA" }}>
            AI Quick Assessment
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--s2)", alignItems: "center" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", fontWeight: 700, color: tierColor }}>
            {score}/1000
          </span>
          <span style={{
            padding: "2px 8px", borderRadius: "var(--r-full)",
            fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase",
            color: tierColor, background: tierColor + "18", border: `1px solid ${tierColor}40`,
          }}>{tier}</span>
        </div>
      </div>

      {/* One-liner summary */}
      <p style={{ fontSize: "0.8rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 var(--s3) 0" }}>
        <strong style={{ color: "var(--text-primary)" }}>{profile.name || profile.username}</strong> is a{" "}
        <strong style={{ color: "#A78BFA" }}>{archetype}</strong> with{" "}
        {accountYears}y of GitHub activity. Primary stack:{" "}
        <strong style={{ color: "var(--text-primary)" }}>{topThree}</strong>.
      </p>

      {/* Strength pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)" }}>
        {strengths.slice(0, 3).map((s, i) => (
          <span key={i} style={{
            fontSize: "0.68rem", padding: "2px 9px", borderRadius: "var(--r-full)",
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
            color: "var(--text-secondary)",
          }}>
            ✦ {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── PDF Print Report ─────────────────────────────────────────────
function PrintReport({ profile, repositories, langDist, langCount }) {
  const ownRepos   = (repositories || []).filter(r => !r.is_fork);
  const top10repos = [...repositories].sort((a, b) => (b.stars||0) - (a.stars||0)).slice(0, 10);
  const score = normScore(parseFloat(profile.popularity_score || 0));
  const { label: tier, color: tierColor } = scoreTier(score);
  const sortedL = Object.entries(langDist).sort((a, b) => b[1] - a[1]);
  const topLang = sortedL[0]?.[0] || "N/A";
  const accountYears = ((profile.account_age_days || 0) / 365).toFixed(1);

  const frontCount  = ownRepos.filter(r => FRONTEND.has((r.language||"").toLowerCase())).length;
  const backCount   = ownRepos.filter(r => BACKEND.has((r.language||"").toLowerCase())).length;
  const totalOwn    = ownRepos.length || 1;
  const archetype = (() => {
    const fPct = (frontCount / totalOwn) * 150;
    const bPct = (backCount  / totalOwn) * 150;
    if (fPct > 40 && bPct > 40) return "Full-Stack Engineer";
    if (fPct > 35) return "Frontend Engineer";
    if (bPct > 35) return "Backend Engineer";
    return "Software Engineer";
  })();

  // Score dimensions (same as ScoreBreakdown)
  const dims = [
    { label: "Community Influence", val: Math.round(Math.min(100, (Math.log10((profile.followers||0)+1)/Math.log10(500000))*100)) },
    { label: "Open Source Impact",  val: Math.round(Math.min(100, (Math.log10((profile.total_stars||0)+1)/Math.log10(300000))*100)) },
    { label: "Code Output",         val: Math.round(Math.min(100, ((profile.public_repos||0)/150)*100)) },
    { label: "Seniority Signal",    val: Math.round(Math.min(100, ((profile.account_age_days||0)/5000)*100)) },
    { label: "Collaboration",       val: Math.round(Math.min(100, (Math.log10((profile.total_forks||0)+1)/Math.log10(100000))*100)) },
    { label: "Tech Breadth",        val: Math.round(Math.min(100, (langCount/10)*100)) },
  ];

  return (
    <div className="print-report">
      {/* Cover */}
      <div className="print-section print-cover">
        <div className="print-logo">⬡ DevLens</div>
        <h1 className="print-name">{profile.name || profile.username}</h1>
        <div className="print-handle">@{profile.username}</div>
        {profile.bio && <p className="print-bio">{profile.bio}</p>}
        <div className="print-cover-meta">
          <span>📍 {profile.location || "—"}</span>
          <span>🎯 {archetype}</span>
          <span>⭐ {score}/1000 · {tier}</span>
          <span>📅 {accountYears} years on GitHub</span>
        </div>
        <div className="print-date">Report generated: {new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</div>
      </div>

      {/* Section 1 — Overview */}
      <div className="print-section">
        <h2 className="print-section-title">§1 — Profile Overview</h2>
        <div className="print-stats-row">
          {[
            ["Public Repos",   profile.public_repos || 0],
            ["Total Stars",    profile.total_stars  || 0],
            ["Total Forks",    profile.total_forks  || 0],
            ["Followers",      profile.followers    || 0],
            ["Account Age",    `${accountYears}y`],
            ["Top Language",   topLang],
          ].map(([l, v]) => (
            <div key={l} className="print-stat-box">
              <div className="print-stat-label">{l}</div>
              <div className="print-stat-value">{v}</div>
            </div>
          ))}
        </div>
        <table className="print-table">
          <tbody>
            {[
              ["Member Since",  new Date(profile.github_created_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"})],
              ["Location",      profile.location || "—"],
              ["Company",       profile.company  || "—"],
              ["Primary Language", topLang],
              ["Language Diversity", `${sortedL.length} languages`],
              ["Archetype",     archetype],
            ].map(([l, v]) => (
              <tr key={l}>
                <td className="print-td-label">{l}</td>
                <td className="print-td-value">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedL.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="print-sub-title">Language Distribution</div>
            {sortedL.slice(0, 8).map(([lang, count]) => {
              const pct = Math.round((count / totalOwn) * 100);
              return (
                <div key={lang} className="print-bar-row">
                  <span className="print-bar-label">{lang}</span>
                  <div className="print-bar-track">
                    <div className="print-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="print-bar-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2 — Top 10 Repos */}
      <div className="print-section">
        <h2 className="print-section-title">§2 — Top 10 Repositories</h2>
        <table className="print-table print-repo-table">
          <thead>
            <tr>
              <th className="print-th">#</th>
              <th className="print-th">Repository</th>
              <th className="print-th">Language</th>
              <th className="print-th">Stars</th>
              <th className="print-th">Forks</th>
              <th className="print-th">Type</th>
            </tr>
          </thead>
          <tbody>
            {top10repos.map((r, i) => (
              <tr key={r.repo_name || i}>
                <td className="print-td">{i + 1}</td>
                <td className="print-td" style={{ fontWeight: 600 }}>{r.repo_name}</td>
                <td className="print-td">{r.language || "—"}</td>
                <td className="print-td">⭐ {r.stars || 0}</td>
                <td className="print-td">🍴 {r.forks || 0}</td>
                <td className="print-td">{r.is_fork ? "Fork" : "Original"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3 — Analytics */}
      <div className="print-section">
        <h2 className="print-section-title">§3 — Analytics Intelligence</h2>
        <div className="print-stats-row">
          {[
            ["Tech Breadth",  `${clamp((sortedL.length/12)*100)}/100`],
            ["Open Source",   `${logNorm((profile.total_stars||0)+(profile.total_forks||0),1000)}/100`],
            ["Community",     `${logNorm(profile.followers||0,500000)}/100`],
            ["Dev Maturity",  `${clamp(((profile.account_age_days||0)/3650)*100)}/100`],
          ].map(([l, v]) => (
            <div key={l} className="print-stat-box">
              <div className="print-stat-label">{l}</div>
              <div className="print-stat-value">{v}</div>
            </div>
          ))}
        </div>
        <div className="print-sub-title" style={{ marginTop: 16 }}>Developer Archetype Assessment</div>
        <p className="print-para">
          Based on repository language distribution and activity patterns,{" "}
          <strong>{profile.name || profile.username}</strong> is identified as a{" "}
          <strong>{archetype}</strong>. Their primary stack ({sortedL.slice(0,3).map(([l])=>l).join(", ")||"N/A"}) and{" "}
          {ownRepos.length} non-fork repositories signal {accountYears} years of active development experience.
        </p>
        <div className="print-sub-title">Benchmark Comparison (Estimated Industry Averages)</div>
        {[
          { label: "Public Repos",  you: profile.public_repos||0, avg: 15,  top: 50   },
          { label: "Total Stars",   you: profile.total_stars||0,  avg: 30,  top: 500  },
          { label: "Followers",     you: profile.followers||0,    avg: 30,  top: 1200 },
          { label: "Languages",     you: sortedL.length,          avg: 3,   top: 8    },
        ].map(({ label, you, avg, top }) => (
          <div key={label} className="print-bench-row">
            <span className="print-bench-label">{label}</span>
            <span className="print-bench-you">You: {you.toLocaleString()}</span>
            <span className="print-bench-avg">Avg: {avg}</span>
            <span className="print-bench-top">Top 10%: {top.toLocaleString()}</span>
            <span className={`print-bench-badge ${you >= avg ? "print-badge-green" : "print-badge-gray"}`}>
              {you >= avg ? "↑ Above avg" : "Below avg"}
            </span>
          </div>
        ))}
      </div>

      {/* Section 4 — Score */}
      <div className="print-section">
        <h2 className="print-section-title">§4 — Intelligence Score Breakdown</h2>
        <div className="print-score-hero">
          <span className="print-score-num">{score}</span>
          <span className="print-score-max">/ 1000</span>
          <span className="print-score-tier" style={{ color: tierColor }}>{tier}</span>
        </div>
        <div className="print-sub-title">Dimension Analysis</div>
        {dims.map(({ label, val }) => (
          <div key={label} className="print-bar-row">
            <span className="print-bar-label">{label}</span>
            <div className="print-bar-track">
              <div className="print-bar-fill" style={{ width: `${val}%` }} />
            </div>
            <span className="print-bar-pct">{val}%</span>
          </div>
        ))}
        <div className="print-tier-track">
          {["Junior","Rising","Mid-Level","Senior","Expert","Legendary"].map(t => (
            <span key={t} className={`print-tier-pill ${t===tier?"print-tier-active":""}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <span>⬡ DevLens — Developer Intelligence Platform</span>
        <span>github.com/{profile.username}</span>
        <span>Generated {new Date().toISOString().slice(0,10)}</span>
      </div>
    </div>
  );
}

// ── Tab icons ────────────────────────────────────────────────────
const TABS = [
  { name: "Overview",     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { name: "Repositories", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  { name: "Analytics",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
  { name: "Score",        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a4.996 4.996 0 0 1 5 5c0 3.2-2.5 5.5-5 5.5s-5-2.3-5-5.5a4.996 4.996 0 0 1 5-5z"/></svg> },
];

// ── Main Page ────────────────────────────────────────────────────
export default function ProfileDetail() {
  const { username }  = useParams();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    getProfileByUsername(username)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || "Profile not found."))
      .finally(() => setLoading(false));
  }, [username]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await refreshProfile(username);
      // Merge profile and repositories so the state structure matches what getProfileByUsername returns
      setData({
        ...r.data.profile,
        repositories: r.data.repositories,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Refresh failed.");
    } finally { setRefreshing(false); }
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="page-content">
      <SkeletonProfileHero />
      <div style={{ marginTop: "var(--s4)" }}><SkeletonStatGrid /></div>
      <div style={{ marginTop: "var(--s4)" }}><SkeletonCard height={200} /></div>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <Link to="/profiles" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--s4)", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Profiles
      </Link>
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  );

  const profile      = data;
  const repositories = data?.repositories || [];

  // ── Language distribution from REPOS (not profile.most_used_language)
  const langDist = repositories.reduce((acc, r) => {
    if (r.language && !r.is_fork) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const langCount    = Object.keys(langDist).length;
  const sortedLangs  = Object.entries(langDist).sort((a, b) => b[1] - a[1]);
  const topLangFromRepos = sortedLangs[0]?.[0] || profile.most_used_language || "N/A";

  return (
    <div className="page-content">
      {/* ── Screen: nav row ── */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s4)" }}>
        <Link to="/profiles" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Profiles
        </Link>
        {/* PDF Download button */}
        <button
          onClick={handlePrint}
          className="btn btn-ghost btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          title="Download PDF report"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PDF
        </button>
      </div>

      {copied && <div className="alert alert-success fade-in no-print">✓ Link copied!</div>}

      <div className="no-print">
        <ProfileCard profile={profile} onRefresh={handleRefresh} onCopyLink={handleCopyLink} loading={refreshing} />
      </div>

      {/* ── Tabs ── */}
      <div className="tabs no-print" style={{ marginTop: "var(--s4)" }}>
        {TABS.map((tab) => (
          <button key={tab.name} className={`tab ${activeTab === tab.name ? "active" : ""}`} onClick={() => setActiveTab(tab.name)} style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="no-print">
        {activeTab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            <StatsGrid profile={profile} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
              {/* Profile Details — now uses computed topLangFromRepos */}
              <div className="card">
                <div className="section-title">Profile Details</div>
                {[
                  ["Member Since",  new Date(profile.github_created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
                  ["Account Age",   `${Math.floor((profile.account_age_days||0) / 365)} years`],
                  ["Top Language",  topLangFromRepos],
                  ["Company",       profile.company  || "—"],
                  ["Location",      profile.location || "—"],
                  ["Analyzed",      new Date(profile.analyzed_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "var(--s2) 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Language chart — uses langDist from repos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                <LanguageChart distribution={langDist} />
                {/* Mini AI Report below chart */}
                <MiniAIReport
                  profile={profile}
                  langDist={langDist}
                  repositories={repositories}
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === "Repositories" && <RepoList repositories={repositories} />}
        {activeTab === "Analytics"    && <AnalyticsDashboard profile={profile} repositories={repositories} />}
        {activeTab === "Score"        && <ScoreBreakdown profile={profile} langCount={langCount} />}
      </div>

      {/* ── Print-only: Full Report ── */}
      <PrintReport
        profile={profile}
        repositories={repositories}
        langDist={langDist}
        langCount={langCount}
      />
    </div>
  );
}
