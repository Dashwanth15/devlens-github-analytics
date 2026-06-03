// Profiles.jsx — CRM-style saved profiles table
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProfiles, deleteProfile } from "../api/profileApi";

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
};

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("analyzed_at");
  const [sortDir, setSortDir] = useState("desc");
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchPage = async (p = 1) => {
    try {
      const r = await getAllProfiles(p, 20);
      setProfiles(r.data);
      setPagination(r.pagination);
      setPage(p);
    } finally { setLoading(false); }
  };

  const handlePageChange = (p) => {
    setLoading(true);
    fetchPage(p);
  };

  useEffect(() => {
    getAllProfiles(1, 20)
      .then((r) => {
        setProfiles(r.data);
        setPagination(r.pagination);
        setPage(1);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleDelete = async (username) => {
    if (!confirm(`Delete @${username}? This cannot be undone.`)) return;
    setDeleting(username);
    try {
      await deleteProfile(username);
      setProfiles((p) => p.filter((x) => x.username !== username));
    } finally { setDeleting(null); }
  };

  const renderSortIcon = (k) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
    );
  };

  // Compute filtered & sorted profiles dynamically on render
  const filtered = (() => {
    let data = [...profiles];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.username.includes(q) || (p.name || "").toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return data;
  })();

  return (
    <div className="page-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s6)" }}>
        <div>
          <h1 className="page-title">Saved Profiles</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {pagination ? `${pagination.total} developers analyzed` : ""}
          </p>
        </div>
        <Link to="/discover" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Analyze New
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s4)" }}>
        <div className="input-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <span className="input-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            className="input"
            style={{ paddingLeft: "var(--s8)" }}
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--s16)", color: "var(--text-muted)" }}>Loading profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p className="empty-state-title">{search ? "No matching profiles" : "No profiles yet"}</p>
            <p className="empty-state-desc">{search ? "Try a different search term." : "Analyze your first developer to get started."}</p>
            {!search && <Link to="/discover" className="btn btn-primary">Analyze Developer</Link>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("popularity_score")}>
                  Score {renderSortIcon("popularity_score")}
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("total_stars")}>
                  Stars {renderSortIcon("total_stars")}
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("followers")}>
                  Followers {renderSortIcon("followers")}
                </th>
                <th>Language</th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("analyzed_at")}>
                  Analyzed {renderSortIcon("analyzed_at")}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.username}>
                  <td>
                    <Link to={`/profile/${p.username}`} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", textDecoration: "none" }}>
                      <img src={p.avatar_url} alt={p.username} style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name || p.username}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>@{p.username}</div>
                      </div>
                    </Link>
                  </td>
                  <td><span className="badge badge-violet">{fmt(p.popularity_score)}</span></td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 4, height: "100%", borderBottom: "none" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {fmt(p.total_stars)}
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }}>
                    {fmt(p.followers)}
                  </td>
                  <td>{p.most_used_language ? <span className="badge badge-gray">{p.most_used_language}</span> : "—"}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {new Date(p.analyzed_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--s2)", justifyContent: "flex-end" }}>
                      <Link to={`/profile/${p.username}`} className="btn btn-ghost btn-sm">View</Link>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deleting === p.username}
                        onClick={() => handleDelete(p.username)}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, padding: 0 }}
                      >
                        {deleting === p.username ? "..." : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--s2)", padding: "var(--s4)", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(page - 1)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Prev
              </button>
              <span style={{ padding: "var(--s2) var(--s4)", fontSize: "0.85rem", color: "var(--text-muted)", alignSelf: "center" }}>{page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNextPage} onClick={() => handlePageChange(page + 1)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Next
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

