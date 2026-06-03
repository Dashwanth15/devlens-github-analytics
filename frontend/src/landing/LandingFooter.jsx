import { useNavigate } from "react-router-dom";

const GithubIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const TwitterIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);


const LINKS = {
  Product: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Discover", path: "/discover" },
    { label: "Analytics", path: "/analytics" },
    { label: "Compare", path: "/compare" },
    { label: "Profiles", path: "/profiles" },
  ],
  Resources: [
    { label: "GitHub API Docs", href: "https://docs.github.com/en/rest" },
    { label: "Source Code", href: "https://github.com" },
    { label: "Report a Bug", href: "#" },
    { label: "Request Feature", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Internship Project", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="landing-footer">
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #7C3AED, #A78BFA)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "#FAFAFA" }}>DevLens</span>
          </div>
          <p className="footer-brand-desc">
            A Developer Intelligence Platform that transforms GitHub data into actionable insights for recruiters, engineers, and teams.
          </p>
          <div style={{ marginTop: 20, fontSize: "0.75rem", color: "#3F3F46" }}>
            Built with ❤️ using React, Node.js, Express, MySQL
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([section, items]) => (
          <div key={section}>
            <div className="footer-col-title">{section}</div>
            <div className="footer-links">
              {items.map((item) =>
                item.path ? (
                  <button key={item.label} className="footer-link" onClick={() => navigate(item.path)}>{item.label}</button>
                ) : (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="footer-link">{item.label}</a>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-copy">
          © 2026 DevLens. Built as an internship SaaS project. All rights reserved.
        </div>
        <div className="footer-socials">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social" title="GitHub"><GithubIcon size={16} /></a>
          <a href="#" className="footer-social" title="Twitter"><TwitterIcon size={16} /></a>
          <a href="#" className="footer-social" title="LinkedIn"><LinkedinIcon size={16} /></a>
        </div>
      </div>
    </footer>
  );
}
