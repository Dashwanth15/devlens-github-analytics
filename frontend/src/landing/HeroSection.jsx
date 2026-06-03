// HeroSection.jsx — World-class animated hero
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap, Star, GitFork, Users } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const FloatCard = ({ children, className, delay = 0 }) => (
  <motion.div
    className={`hero-float-card ${className}`}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay }}
    style={{ animation: `float ${3 + delay}s ease-in-out ${delay}s infinite alternate` }}
  >
    {children}
  </motion.div>
);

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <style>{`
        @keyframes float {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-12px); }
        }
      `}</style>

      {/* Background elements */}
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      {/* Floating preview cards */}
      <FloatCard className="hero-float-card-left" delay={0.8}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <img src="https://avatars.githubusercontent.com/dashwanth15" alt="dashwanth15" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#FAFAFA", fontSize: "0.8rem" }}>dashwanth15</div>
            <div style={{ color: "#52525B", fontSize: "0.7rem" }}>Dashwanth Madduri</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: "0.75rem", color: "#71717A" }}>
          <span style={{ color: "#F59E0B" }}>⭐ 5</span>
          <span style={{ color: "#10B981" }}>👥 5</span>
          <span style={{ color: "#A78BFA" }}>🏆 225</span>
        </div>
      </FloatCard>

      <FloatCard className="hero-float-card-right" delay={1.0}>
        <div style={{ fontSize: "0.72rem", color: "#A78BFA", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          🤖 AI Developer Summary
        </div>
        <div style={{ fontSize: "0.78rem", color: "#71717A", lineHeight: 1.5, maxWidth: 200 }}>
          <span style={{ color: "#FAFAFA" }}>Full-Stack Engineer</span> — MERN stack learner with 15 repos. JavaScript, HTML & TypeScript focus.
        </div>
      </FloatCard>

      <FloatCard className="hero-float-card-top" delay={1.2}>
        <div style={{ fontSize: "0.72rem", color: "#52525B", marginBottom: 4 }}>Intelligence Score</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, fontFamily: "JetBrains Mono, monospace", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          225
        </div>
        <div style={{ fontSize: "0.7rem", color: "#7C3AED" }}>⬡ Junior Tier</div>
      </FloatCard>

      <FloatCard className="hero-float-card-bot" delay={1.4}>
        <div style={{ fontSize: "0.72rem", color: "#52525B", marginBottom: 6 }}>Language Distribution</div>
        <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", gap: 2, width: 160 }}>
          {[["#f1e05a", 30], ["#e34c26", 20], ["#3178c6", 10], ["#3572A5", 10], ["#f34b7d", 10], ["#563d7c", 10]].map(([c, w], i) => (
            <div key={i} style={{ flex: w, background: c, borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, fontSize: "0.68rem", color: "#52525B" }}>
          <span>JS 30%</span><span>HTML 20%</span><span>TS 10%</span><span>Py 10%</span>
        </div>
      </FloatCard>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.div {...fadeUp(0.1)}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Developer Intelligence Platform
          </div>
        </motion.div>

        <motion.h1 className="hero-heading" {...fadeUp(0.2)}>
          <span className="hero-heading-line">Analyze Developers</span>
          <span className="hero-heading-gradient">Beyond GitHub Metrics.</span>
        </motion.h1>

        <motion.p className="hero-sub" {...fadeUp(0.3)}>
          DevLens transforms raw GitHub data into actionable developer intelligence —
          scores, insights, comparisons, and AI-powered career analysis in seconds.
        </motion.p>

        <motion.div className="hero-actions" {...fadeUp(0.4)}>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/discover")}
            style={{ gap: 8 }}
          >
            <Zap size={18} /> Start Analyzing Free
            <ArrowRight size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-secondary btn-lg"
            onClick={() => document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth" })}
            style={{ gap: 8 }}
          >
            <Play size={16} /> See It In Action
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          {...fadeUp(0.5)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, fontSize: "0.8rem", color: "#52525B" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={14} style={{ color: "#F59E0B" }} /> Free to use
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <GitFork size={14} style={{ color: "#10B981" }} /> GitHub API powered
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} style={{ color: "#7C3AED" }} /> Built for recruiters & engineers
          </span>
        </motion.div>
      </div>
    </section>
  );
}
