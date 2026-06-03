// ProfileCard.jsx — Redesigned hero profile display
export default function ProfileCard({ profile, onRefresh, onCopyLink, loading }) {
  const fmt = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toLocaleString();
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    navigator.clipboard.writeText(url);
    onCopyLink?.();
  };

  return (
    <div className="card fade-up">
      <div className="profile-hero">
        <img src={profile.avatar_url} alt={profile.username} className="profile-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="profile-name">{profile.name || profile.username}</h1>
          <div className="profile-username">
            <a href={profile.profile_url} target="_blank" rel="noreferrer">
              @{profile.username}
            </a>
          </div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--s4)" }}>
            {profile.company  && (
              <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/></svg>
                {profile.company}
              </span>
            )}
            {profile.location && (
              <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {profile.location}
              </span>
            )}
            {profile.email    && (
              <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {profile.email}
              </span>
            )}
            {profile.blog     && (
              <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <a href={profile.blog} target="_blank" rel="noreferrer" style={{ color: "var(--accent-light)" }}>
                  {profile.blog.replace(/^https?:\/\//, "")}
                </a>
              </span>
            )}
            <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <strong style={{ color: "var(--text-primary)" }}>{fmt(profile.followers)}</strong>
              &nbsp;followers
            </span>
            <span className="profile-meta-item" style={{ display: "inline-flex", alignItems: "center" }}>
              <strong style={{ color: "var(--text-primary)" }}>{fmt(profile.following)}</strong>
              &nbsp;following
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleCopy} title="Copy shareable link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Share
          </button>
          {onRefresh && (
            <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M16 3h5v5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 21H3v-5"/></svg>
              Refresh
            </button>
          )}
          <a href={profile.profile_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

