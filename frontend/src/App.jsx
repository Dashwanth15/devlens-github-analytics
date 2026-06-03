// App.jsx — DevLens routing: Landing at /, App shell at /dashboard/*
import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import Profiles from "./pages/Profiles";
import Compare from "./pages/Compare";
import Analytics from "./pages/Analytics";
import ProfileDetail from "./pages/ProfileDetail";
import LandingPage from "./landing/LandingPage";
import Resume from "./pages/Resume";
import Career from "./pages/Career";
import Jobs from "./pages/Jobs";
import Ranking from "./pages/Ranking";
import { getAllProfiles } from "./api/profileApi";

const PAGE_TITLES = {
  "/dashboard":  { title: "Dashboard",  icon: "⬡" },
  "/discover":   { title: "Discover",   icon: "🔍" },
  "/profiles":   { title: "Profiles",   icon: "👤" },
  "/compare":    { title: "Compare",    icon: "⚖️" },
  "/analytics":  { title: "Analytics",  icon: "📊" },
  "/resume":     { title: "Resume Verification", icon: "📄" },
  "/career":     { title: "Career Growth",       icon: "📈" },
  "/jobs":       { title: "Job Match",           icon: "🎯" },
  "/ranking":    { title: "Candidate Ranking",   icon: "🏆" },
};

function Topbar() {
  const { pathname } = useLocation();
  const isProfileDetail = pathname.startsWith("/profile/");
  const meta = PAGE_TITLES[pathname]
    || (isProfileDetail ? { title: pathname.replace("/profile/", "@"), icon: "👤" } : { title: "DevLens", icon: "⬡" });

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        <span>{meta.icon}</span>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{meta.title}</span>
      </div>
      <div className="topbar-actions">
        <Link to="/" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>← Landing</Link>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
          GitHub ↗
        </a>
      </div>
    </header>
  );
}

function AppLayout() {
  const [profileCount, setProfileCount] = useState(0);

  useEffect(() => {
    getAllProfiles(1, 1)
      .then((r) => setProfileCount(r.pagination?.total || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Sidebar profileCount={profileCount} />
      <div className="main-content">
        <Topbar />
        <Routes>
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/discover"          element={<Discover />} />
          <Route path="/profiles"          element={<Profiles />} />
          <Route path="/compare"           element={<Compare />} />
          <Route path="/analytics"         element={<Analytics />} />
          <Route path="/resume"            element={<Resume />} />
          <Route path="/career"            element={<Career />} />
          <Route path="/jobs"              element={<Jobs />} />
          <Route path="/ranking"           element={<Ranking />} />
          <Route path="/profile/:username" element={<ProfileDetail />} />
          <Route path="*" element={
            <div className="page-content" style={{ textAlign: "center", paddingTop: "var(--s16)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--s4)" }}>404</div>
              <h2 style={{ marginBottom: "var(--s2)", color: "var(--text-secondary)" }}>Page not found</h2>
              <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: "var(--s4)" }}>Go to Dashboard</Link>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// Route splitter — landing vs app shell
function RouterRoot() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  return isLanding ? <LandingPage /> : <AppLayout />;
}

export default function App() {
  return (
    <HashRouter>
      <RouterRoot />
    </HashRouter>
  );
}
