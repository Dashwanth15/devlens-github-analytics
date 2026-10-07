// Compare.jsx — Side-by-side developer comparison with Radar chart & universal GitHub support
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllProfiles, compareDevelopers } from "../api/profileApi";
import { extractUsername, isValidGitHubUsername } from "../utils/github";
import GitHubDeveloperInput from "../components/GitHubDeveloperInput";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const fmt = (n) => {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
};

const normalize = (val, max) => Math.min(100, Math.round((Math.log10(val + 1) / Math.log10(max + 1)) * 100));

const getDimensions = (p) => [
  { dim: "Community",  val: normalize(p.followers || 0, 500000) },
  { dim: "Stars",      val: normalize(p.total_stars || 0, 300000) },
  { dim: "Forks",      val: normalize(p.total_forks || 0, 100000) },
  { dim: "Repos",      val: Math.min(100, Math.round(((p.public_repos || 0) / 150) * 100)) },
  { dim: "Seniority",  val: Math.min(100, Math.round(((p.account_age_days || 0) / 5000) * 100)) },
  { dim: "Score",      val: Math.min(100, Math.round((parseFloat(p.popularity_score || 0) / 2000000) * 100)) },
];

const COMPARE_ROWS = [
  { label: "Followers",    key: "followers",        higher: true },
  { label: "Following",    key: "following",        higher: false },
  { label: "Public Repos", key: "public_repos",     higher: true },
  { label: "Total Stars",  key: "total_stars",      higher: true },
  { label: "Total Forks",  key: "total_forks",      higher: true },
  { label: "Gists",        key: "public_gists",     higher: true },
  { label: "Score",        key: "popularity_score", higher: true, parse: parseFloat },
  { label: "Account Age",  key: "account_age_days", higher: true, unit: "days" },
];

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [dev1Input, setDev1Input] = useState(searchParams.get("dev1") || "");
  const [dev2Input, setDev2Input] = useState(searchParams.get("dev2") || "");

  const [dev1Profile, setDev1Profile] = useState(null);
  const [dev2Profile, setDev2Profile] = useState(null);

  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Load recent profiles and optionally execute initial comparison
  useEffect(() => {
    getAllProfiles(1, 20)
      .then((res) => {
        const list = res.data || [];
        setRecentProfiles(list);

        const paramDev1 = searchParams.get("dev1");
        const paramDev2 = searchParams.get("dev2");

        if (paramDev1 && paramDev2) {
          executeComparison(paramDev1, paramDev2);
        } else if (list.length >= 2 && !dev1Input && !dev2Input) {
          setDev1Input(list[0].username);
          setDev2Input(list[1].username);
          executeComparison(list[0].username, list[1].username);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const executeComparison = async (raw1, raw2) => {
    const u1 = extractUsername(raw1);
    const u2 = extractUsername(raw2);

    if (!u1) {
      setError("Please enter a GitHub username or profile URL for Developer 1.");
      return;
    }
    if (!u2) {
      setError("Please enter a GitHub username or profile URL for Developer 2.");
      return;
    }
    if (!isValidGitHubUsername(u1)) {
      setError(`'${u1}' is not a valid GitHub username format.`);
      return;
    }
    if (!isValidGitHubUsername(u2)) {
      setError(`'${u2}' is not a valid GitHub username format.`);
      return;
    }
    if (u1 === u2) {
      setError("Please choose two different developers to compare. You cannot compare a developer with themselves.");
      return;
    }

    setComparing(true);
    setError(null);

    try {
      const res = await compareDevelopers(u1, u2);
      if (res.success && res.data) {
        setDev1Profile(res.data.developer1);
        setDev2Profile(res.data.developer2);
        setSearchParams({ dev1: u1, dev2: u2 });

        // Refresh recent profiles in the background to update latest-20 queue
        getAllProfiles(1, 20).then((r) => setRecentProfiles(r.data || [])).catch(() => {});
      } else {
        throw new Error(res.message || "Failed to compare developers.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to compare developers.";
      setError(msg);
    } finally {
      setComparing(false);
    }
  };

  const handleCompareClick = (e) => {
    if (e) e.preventDefault();
    executeComparison(dev1Input, dev2Input);
  };

  const handleSwap = () => {
    const tempInput = dev1Input;
    const tempProfile = dev1Profile;
    setDev1Input(dev2Input);
    setDev1Profile(dev2Profile);
    setDev2Input(tempInput);
    setDev2Profile(tempProfile);

    if (dev2Input && tempInput) {
      setSearchParams({ dev1: extractUsername(dev2Input), dev2: extractUsername(tempInput) });
    }
  };

  // Build radar data (merged)
  const radarData = dev1Profile && dev2Profile
    ? getDimensions(dev1Profile).map((d, i) => ({
        dim: d.dim,
        [dev1Profile.username]: d.val,
        [dev2Profile.username]: getDimensions(dev2Profile)[i].val,
      }))
    : [];

  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom: "var(--s6)" }}>
        <h1 className="page-title">Compare Developers</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Side-by-side intelligence comparison across any public GitHub developers.
        </p>
      </div>

      {/* Main Developer Input Panel */}
      <div className="card" style={{ marginBottom: "var(--s6)", padding: "var(--s6)" }}>
        <form onSubmit={handleCompareClick}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "var(--s5)",
              alignItems: "start",
            }}
          >
            {/* Developer 1 Input */}
            <div>
              <GitHubDeveloperInput
                id="dev1-input"
                label="Developer 1"
                value={dev1Input}
                onChange={(val) => {
                  setDev1Input(val);
                  setError(null);
                }}
                onSelectProfile={(p) => {
                  setDev1Input(p.username);
                  setDev1Profile(p);
                  setError(null);
                }}
                recentProfiles={recentProfiles}
                placeholder="e.g. torvalds or https://github.com/torvalds"
                helperText="Analyze any public GitHub profile — saved profiles are only recent suggestions."
                resolvedProfile={dev1Profile}
                onClear={() => {
                  setDev1Input("");
                  setDev1Profile(null);
                }}
                disabled={comparing}
                onKeyDown={(e) => e.key === "Enter" && handleCompareClick(e)}
                accentColor="#7C3AED"
              />
            </div>

            {/* VS Divider & Swap Button */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--s2)",
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                vs
              </div>
              <button
                type="button"
                onClick={handleSwap}
                disabled={comparing || (!dev1Input && !dev2Input)}
                title="Swap developers"
                className="btn btn-ghost"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  borderRadius: "999px",
                  color: "var(--text-secondary)",
                }}
              >
                ⇄ Swap
              </button>
            </div>

            {/* Developer 2 Input */}
            <div>
              <GitHubDeveloperInput
                id="dev2-input"
                label="Developer 2"
                value={dev2Input}
                onChange={(val) => {
                  setDev2Input(val);
                  setError(null);
                }}
                onSelectProfile={(p) => {
                  setDev2Input(p.username);
                  setDev2Profile(p);
                  setError(null);
                }}
                recentProfiles={recentProfiles}
                placeholder="e.g. gaearon or https://github.com/gaearon"
                helperText="Analyze any public GitHub profile — saved profiles are only recent suggestions."
                resolvedProfile={dev2Profile}
                onClear={() => {
                  setDev2Input("");
                  setDev2Profile(null);
                }}
                disabled={comparing}
                onKeyDown={(e) => e.key === "Enter" && handleCompareClick(e)}
                accentColor="#10B981"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "var(--s6)",
              paddingTop: "var(--s4)",
              borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {comparing ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--accent-light)" }}>
                  <span
                    className="spinner"
                    style={{ width: 14, height: 14, borderWidth: 2, display: "inline-block" }}
                  />
                  Fetching and analyzing developers from GitHub...
                </span>
              ) : (
                <span>Works with any public GitHub profile. No prior discovery or saving needed.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={comparing || !dev1Input.trim() || !dev2Input.trim()}
              className="btn btn-primary"
              style={{
                padding: "var(--s3) var(--s8)",
                fontSize: "0.95rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {comparing ? "Comparing Developers..." : "Compare Developers"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>

        {/* Error notification */}
        {error && (
          <div
            className="alert alert-warning"
            style={{
              marginTop: "var(--s4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {dev1Profile && dev2Profile && (
        <div className="fade-in">
          {/* Avatar Cards Header */}
          <div className="compare-grid" style={{ marginBottom: "var(--s4)" }}>
            {[
              { profile: dev1Profile, color: "#7C3AED", label: "Developer 1" },
              { profile: dev2Profile, color: "#10B981", label: "Developer 2" },
            ].map(({ profile: p, color, label }) => (
              <div
                className="card"
                key={p.username}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s4)",
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${color}40` }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", color: color, fontWeight: 700, textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name || p.username}
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    @{p.username}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {p.most_used_language && (
                    <span className="badge badge-gray" style={{ display: "block", marginBottom: 4 }}>
                      {p.most_used_language}
                    </span>
                  )}
                  <span className="badge badge-violet" style={{ fontSize: "0.75rem" }}>
                    Score: {fmt(p.popularity_score)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="card" style={{ marginBottom: "var(--s4)" }}>
            <div className="section-title">Radar Comparison</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Radar
                  name={dev1Profile.username}
                  dataKey={dev1Profile.username}
                  stroke="#7C3AED"
                  fill="#7C3AED"
                  fillOpacity={0.25}
                />
                <Radar
                  name={dev2Profile.username}
                  dataKey={dev2Profile.username}
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    fontSize: "0.85rem",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--s8)", marginTop: "var(--s3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "0.85rem" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7C3AED" }} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>@{dev1Profile.username}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "0.85rem" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>@{dev2Profile.username}</span>
              </div>
            </div>
          </div>

          {/* Stat Comparison Table */}
          <div className="card">
            <div className="section-title">Stat Comparison</div>
            {COMPARE_ROWS.map((row) => {
              const lv = row.parse ? row.parse(dev1Profile[row.key]) : dev1Profile[row.key] || 0;
              const rv = row.parse ? row.parse(dev2Profile[row.key]) : dev2Profile[row.key] || 0;
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
        </div>
      )}

      {/* Initial empty state / guidance if no developers compared yet */}
      {!dev1Profile && !dev2Profile && !comparing && (
        <div className="card" style={{ padding: "var(--s10)", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--s3)" }}>⚖️</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "var(--s2)" }}>
            Ready to Compare
          </div>
          <p style={{ color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", fontSize: "0.9rem" }}>
            Enter any two public GitHub usernames or profile URLs above, or select from recent suggestions, then click
            Compare Developers.
          </p>
        </div>
      )}
    </div>
  );
}
