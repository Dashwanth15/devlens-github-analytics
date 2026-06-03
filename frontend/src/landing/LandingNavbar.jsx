// LandingNavbar.jsx — Sticky glassmorphism navbar
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

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


const links = [
  { label: "Features", href: "#features" },
  { label: "Analytics", href: "#analytics" },
  { label: "Compare", href: "#compare" },
  { label: "How it Works", href: "#how" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      className={`landing-nav ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <a href="#" className="landing-nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        <div className="landing-nav-logo-icon">⬡</div>
        <span className="landing-nav-logo-text">DevLens</span>
        <span style={{ fontSize: "0.6rem", background: "rgba(124,58,237,0.15)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.3)", padding: "2px 6px", borderRadius: 9999, fontWeight: 700, marginLeft: 4 }}>BETA</span>
      </a>

      {/* Nav links */}
      <div className="landing-nav-links">
        {links.map((l) => (
          <button key={l.label} className="landing-nav-link" onClick={() => scrollTo(l.href)}>
            {l.label}
          </button>
        ))}
        <a href="https://github.com" target="_blank" rel="noreferrer" className="landing-nav-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GithubIcon size={14} /> GitHub
        </a>
      </div>

      {/* CTA */}
      <div className="landing-nav-actions">
        <button
          className="landing-nav-link"
          onClick={() => navigate("/dashboard")}
        >
          Sign In
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary"
          style={{ gap: 6 }}
          onClick={() => navigate("/discover")}
        >
          <Zap size={14} /> Get Started
        </motion.button>
      </div>
    </motion.nav>
  );
}
