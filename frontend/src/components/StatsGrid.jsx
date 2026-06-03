// StatsGrid.jsx — Stats with context and visual hierarchy
const stats = (p) => {
  const fmt = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toLocaleString();
  };

  return [
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
      label: "Repositories",
      value: fmt(p.public_repos),
      sub: "public repos"
    },
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      label: "Total Stars",
      value: fmt(p.total_stars),
      sub: "earned across repos"
    },
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V9a4 4 0 0 0-4-4H9"/><line x1="6" y1="9" x2="6" y2="15"/></svg>,
      label: "Total Forks",
      value: fmt(p.total_forks),
      sub: "by the community"
    },
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      label: "Followers",
      value: fmt(p.followers),
      sub: "GitHub followers"
    },
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      label: "Gists",
      value: fmt(p.public_gists),
      sub: "public gists"
    },
    {
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      label: "Account Age",
      value: `${Math.floor(p.account_age_days / 365)}y`,
      sub: `${p.account_age_days} days`
    },
  ];
};

export default function StatsGrid({ profile }) {
  return (
    <div className="stat-grid fade-up">
      {stats(profile).map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="stat-card-label" style={{ display: "flex", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", color: "var(--text-muted)" }}>{s.icon}</span>
            {s.label}
          </div>
          <div className="stat-card-value">{s.value}</div>
          <div className="stat-card-context">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

