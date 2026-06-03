// RepoList.jsx — Professional repository explorer
const LANG_COLORS = {
  JavaScript:"#f1e05a", TypeScript:"#3178c6", Python:"#3572A5",
  Java:"#b07219", C:"#555555", "C++":"#f34b7d", "C#":"#178600",
  Go:"#00ADD8", Rust:"#dea584", Ruby:"#701516", PHP:"#4F5D95",
  Swift:"#F05138", Kotlin:"#A97BFF", HTML:"#e34c26", CSS:"#563d7c",
  Shell:"#89e051", Vue:"#41b883", Dart:"#00B4AB", OpenSCAD:"#e5cd31",
};

const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n?.toLocaleString() ?? "0");

export default function RepoList({ repositories }) {
  if (!repositories || repositories.length === 0) {
    return (
      <div className="card">
        <div className="empty-state" style={{ padding: "var(--s10)" }}>
          <div className="empty-state-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <p className="empty-state-title">No repositories</p>
          <p className="empty-state-desc">This user has no public repositories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s5)" }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Top Repositories</div>
        <span className="badge badge-gray">{repositories.length} repos</span>
      </div>
      <div className="repo-grid">
        {repositories.map((repo) => (
          <a
            key={repo.repo_name || repo.id}
            href={repo.repo_url}
            target="_blank"
            rel="noreferrer"
            className="repo-card"
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="repo-name">{repo.repo_name}</div>
              {repo.description && (
                <div className="repo-desc" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "480px" }}>
                  {repo.description}
                </div>
              )}
              <div className="repo-meta" style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                {repo.language && (
                  <span className="repo-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                    <span className="lang-dot" style={{ background: LANG_COLORS[repo.language] || "#7C3AED", marginRight: 4 }} />
                    {repo.language}
                  </span>
                )}
                <span className="repo-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {fmt(repo.stars)}
                </span>
                <span className="repo-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V9a4 4 0 0 0-4-4H9"/><line x1="6" y1="9" x2="6" y2="15"/></svg>
                  {fmt(repo.forks)}
                </span>
                {repo.is_fork && <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>fork</span>}
              </div>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

