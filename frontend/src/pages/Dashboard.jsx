// Dashboard.jsx — Home page with widgets and recent profiles
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProfiles } from "../api/profileApi";

const fmt = (n) => {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
};

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProfiles(1, 50)
      .then((r) => setProfiles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStars = profiles.reduce((s, p) => s + (p.total_stars || 0), 0);
  const topProfile = profiles.reduce((top, p) =>
    parseFloat(p.popularity_score) > parseFloat(top?.popularity_score || 0) ? p : top, null);
  const langs = profiles.reduce((acc, p) => {
    if (p.most_used_language) acc[p.most_used_language] = (acc[p.most_used_language] || 0) + 1;
    return acc;
  }, {});
  const topLang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--s8)" }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Overview of your analyzed developer profiles
        </p>
      </div>

      {/* Widget Row */}
      <div className="widget-grid" style={{ marginBottom: "var(--s8)" }}>
        <div className="widget-card">
          <div className="widget-label">Profiles Analyzed</div>
          <div className="widget-value" style={{ color: "var(--accent-light)" }}>
            {loading ? "—" : profiles.length}
          </div>
          <div className="widget-sub">stored in database</div>
        </div>
        <div className="widget-card">
          <div className="widget-label">Total Stars Tracked</div>
          <div className="widget-value" style={{ color: "#F59E0B" }}>
            {loading ? "—" : fmt(totalStars)}
          </div>
          <div className="widget-sub">across all profiles</div>
        </div>
        <div className="widget-card">
          <div className="widget-label">Top Language</div>
          <div className="widget-value" style={{ fontSize: "1.4rem", color: "var(--success)" }}>
            {loading ? "—" : (topLang || "N/A")}
          </div>
          <div className="widget-sub">most common in saved profiles</div>
        </div>
        <div className="widget-card">
          <div className="widget-label">Highest Score</div>
          <div className="widget-value" style={{ color: "#F43F5E" }}>
            {loading ? "—" : (topProfile ? fmt(topProfile.popularity_score) : "—")}
          </div>
          <div className="widget-sub">{topProfile?.username || "no profiles yet"}</div>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>

        {/* Recent Profiles */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s5)" }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Recent Profiles</div>
            <Link to="/profiles" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading...</div>
          ) : profiles.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--s8)" }}>
              <div className="empty-state-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <p className="empty-state-title">No profiles yet</p>
              <p className="empty-state-desc">Use Discover to analyze your first GitHub profile.</p>
              <Link to="/discover" className="btn btn-primary btn-sm">Start Analyzing</Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Stars</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {profiles.slice(0, 6).map((p) => (
                  <tr key={p.username}>
                    <td>
                      <Link to={`/profile/${p.username}`} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", textDecoration: "none" }}>
                        <img src={p.avatar_url} alt={p.username} style={{ width: 28, height: 28, borderRadius: "50%" }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.name || p.username}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>@{p.username}</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", borderBottom: "none", height: "100%", alignSelf: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {fmt(p.total_stars)}
                    </td>
                    <td>
                      <span className="badge badge-violet">{fmt(p.popularity_score)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions + Language Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <div className="card">
            <div className="section-title">Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
              <Link to="/discover" className="btn btn-primary" style={{ justifyContent: "flex-start", gap: 8, display: "inline-flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Analyze New Developer
              </Link>
              <Link to="/compare" className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, display: "inline-flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16 12 12 8 16"/><path d="M12 12V3"/><path d="M8 21h8"/></svg>
                Compare Developers
              </Link>
              <Link to="/profiles" className="btn btn-secondary" style={{ justifyContent: "flex-start", gap: 8, display: "inline-flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Browse Saved Profiles
              </Link>
            </div>
          </div>

          {Object.keys(langs).length > 0 && (
            <div className="card">
              <div className="section-title">Languages in Your Database</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                {Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([lang, count]) => (
                  <div key={lang} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{lang}</span>
                    <span className="badge badge-gray">{count} dev{count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
