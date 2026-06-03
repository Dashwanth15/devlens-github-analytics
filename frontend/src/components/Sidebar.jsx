// Sidebar.jsx — DevLens sidebar navigation
import { Link, useLocation } from "react-router-dom";

const nav = [
  { label: "Main", items: [
    { to: "/dashboard", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="10" rx="1"/>
        <rect width="7" height="5" x="3" y="14" rx="1"/>
      </svg>
    ), text: "Dashboard" },
    { to: "/discover", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
      </svg>
    ), text: "Discover" },
    { to: "/profiles", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ), text: "Profiles" },
  ]},
  { label: "Intelligence", items: [
    { to: "/compare", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16 12 12 8 16"/>
        <path d="M12 12V3"/>
        <path d="M8 21h8"/>
      </svg>
    ), text: "Compare" },
    { to: "/analytics", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ), text: "Analytics" },
    { to: "/career", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 14 4-4 4 4"/>
        <path d="M4 20V4h16"/>
      </svg>
    ), text: "Career Intel" },
  ]},
  { label: "Hiring", items: [
    { to: "/resume", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="m9 15 2 2 4-4"/>
      </svg>
    ), text: "Resume Verify" },
    { to: "/jobs", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ), text: "Job Match" },
    { to: "/ranking", icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
        <path d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/>
      </svg>
    ), text: "Rank Candidates" },
  ]},
];

export default function Sidebar({ profileCount = 0 }) {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">⬡</div>
        <span className="sidebar-logo-text">DevLens</span>
        <span className="sidebar-logo-badge">BETA</span>
      </Link>

      <div className="sidebar-section">
        {nav.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${pathname === item.to ? "active" : ""}`}
              >
                <span className="sidebar-link-icon" style={{ display: "inline-flex", alignItems: "center" }}>{item.icon}</span>
                <span>{item.text}</span>
                {item.to === "/profiles" && profileCount > 0 && (
                  <span className="sidebar-link-badge">{profileCount}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">DevLens v1.0 · GitHub API</p>
      </div>
    </aside>
  );
}

