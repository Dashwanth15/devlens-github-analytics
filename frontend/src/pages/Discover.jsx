// Discover.jsx — Search page with step-by-step loading progress
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeProfile, refreshProfile } from "../api/profileApi";
import ProfileCard from "../components/ProfileCard";
import StatsGrid from "../components/StatsGrid";
import ScoreBreakdown from "../components/ScoreBreakdown";
import LanguageChart from "../components/LanguageChart";
import RepoList from "../components/RepoList";
import { SkeletonProfileHero, SkeletonStatGrid, SkeletonCard } from "../components/Skeleton";
import { extractUsername } from "../utils/github";

const STEPS = [
  "Fetching GitHub profile...",
  "Analyzing repositories...",
  "Computing intelligence score...",
  "Saving to database...",
];

const ACTIVE_TABS = ["Overview", "Repositories", "Analytics", "Score"];

export default function Discover() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [activeTab, setActiveTab] = useState("Overview");
  const [copied, setCopied] = useState(false);

  const runSteps = async (fn) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(0);
    const stepTimer = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 600);

    try {
      const data = await fn();
      clearInterval(stepTimer);
      setActiveStep(STEPS.length);
      setResult(data.data);
      setAlreadyExists(data.alreadyExists);
      setActiveTab("Overview");

      // Smoothly navigate to the detailed profile page where PDF print & AI summary are fully active
      setTimeout(() => {
        const u = data.data?.profile?.username || username.trim();
        navigate(`/profile/${u}`);
      }, 600);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    const cleanUsername = extractUsername(username);
    if (!cleanUsername) return;
    setUsername(cleanUsername);
    runSteps(() => analyzeProfile(cleanUsername));
  };

  const handleRefresh = () => {
    const u = result?.profile?.username || username.trim();
    runSteps(() => refreshProfile(u));
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profile = result?.profile;
  const repositories = result?.repositories || [];
  const langDist = profile?.language_distribution || repositories.reduce((acc, r) => {
    if (r.language && !r.is_fork) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const langCount = Object.keys(langDist).length;

  return (
    <div className="page-content">
      {/* Hero Search */}
      <div className="discover-hero" style={{ paddingTop: result ? "var(--s6)" : undefined }}>
        {!result && (
          <>
            <h1 className="discover-heading">Analyze Any Developer</h1>
            <p className="discover-sub">
              Enter a GitHub username to generate a full intelligence report — scores, insights, repositories, and more.
            </p>
          </>
        )}
        <form className="discover-search-wrap" onSubmit={handleAnalyze}
          style={{ maxWidth: result ? "700px" : "600px", marginBottom: result ? "var(--s6)" : undefined }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <span className="input-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </span>
            <input
              className={`input ${!result ? "input-hero" : ""}`}
              type="text"
              placeholder="Username or github.com/username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !username.trim()}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Analyzing</>
              : "Analyze →"
            }
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Step Progress */}
      {loading && (
        <div className="card fade-in" style={{ maxWidth: 400, margin: "0 auto var(--s6)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--s3)" }}>ANALYSIS PROGRESS</div>
          {STEPS.map((step, i) => (
            <div className="progress-step" key={i}>
              <div className={`step-dot ${i < activeStep ? "done" : i === activeStep ? "active" : "pending"}`} />
              <span style={{ color: i <= activeStep ? "var(--text-primary)" : "var(--text-muted)", fontSize: "0.85rem" }}>{step}</span>
              {i < activeStep && <span style={{ marginLeft: "auto", color: "var(--success)", fontSize: "0.8rem" }}>✓</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skeletons while loading */}
      {loading && !result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <SkeletonProfileHero />
          <SkeletonStatGrid />
          <SkeletonCard height={200} />
        </div>
      )}

      {/* Notifications */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {copied && <div className="alert alert-success fade-in">✓ Link copied to clipboard!</div>}
      {alreadyExists && !loading && result && (
        <div className="alert alert-info" style={{ justifyContent: "space-between" }}>
          <span>📋 Profile loaded from database — previously analyzed.</span>
          <button className="btn btn-ghost btn-sm" onClick={handleRefresh}>🔄 Re-analyze</button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="fade-up">
          <ProfileCard profile={profile} onRefresh={handleRefresh} onCopyLink={handleCopyLink} loading={loading} />

          {/* Tabs */}
          <div className="tabs" style={{ marginTop: "var(--s4)" }}>
            {ACTIVE_TABS.map((tab) => (
              <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "Overview" && "📋 "}
                {tab === "Repositories" && "📦 "}
                {tab === "Analytics" && "📊 "}
                {tab === "Score" && "🏆 "}
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
              <StatsGrid profile={profile} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
                <div className="card">
                  <div className="section-title">Profile Insights</div>
                  {[
                    ["📅 Member Since", new Date(profile.github_created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
                    ["🕐 Account Age", `${Math.floor(profile.account_age_days / 365)} years, ${profile.account_age_days % 365} days`],
                    ["💻 Top Language", profile.most_used_language || "N/A"],
                    ["🏢 Company", profile.company || "—"],
                    ["📍 Location", profile.location || "—"],
                    ["⭐ Total Stars", profile.total_stars?.toLocaleString()],
                    ["🍴 Total Forks", profile.total_forks?.toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "var(--s2) 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <LanguageChart distribution={langDist} />
              </div>
            </div>
          )}

          {activeTab === "Repositories" && <RepoList repositories={repositories} />}

          {activeTab === "Analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
              <LanguageChart distribution={langDist} />
              <div className="card">
                <div className="section-title">Repository Stats</div>
                <table className="data-table">
                  <thead>
                    <tr><th>Repository</th><th>Language</th><th>⭐ Stars</th><th>🍴 Forks</th></tr>
                  </thead>
                  <tbody>
                    {repositories.slice(0, 10).map((r) => (
                      <tr key={r.repo_name || r.id}>
                        <td><a href={r.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-light)" }}>{r.repo_name}</a></td>
                        <td><span className="badge badge-gray">{r.language || "—"}</span></td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }}>{r.stars?.toLocaleString()}</td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }}>{r.forks?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Score" && (
            <ScoreBreakdown profile={profile} langCount={langCount} />
          )}
        </div>
      )}

      {/* Empty state (no search yet) */}
      {!result && !loading && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">Search for any GitHub developer</p>
          <p className="empty-state-desc">Enter a GitHub username above to generate a full developer intelligence report.</p>
          <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap", justifyContent: "center" }}>
            {["torvalds", "gaearon", "sindresorhus", "tj"].map((u) => (
              <button key={u} className="btn btn-secondary btn-sm" onClick={() => { setUsername(u); }}>
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
