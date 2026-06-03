// FeaturesSection.jsx — Premium feature cards with mouse-track glow
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, GitCompare, Brain, Trophy, Zap, Users, TrendingUp, Shield, Code2 } from "lucide-react";

const FEATURES = [
  {
    icon: <Brain size={20} />,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
    title: "Developer Intelligence Score",
    desc: "Composite score across 6 dimensions: community influence, code output, open source impact, tech breadth, seniority, and collaboration.",
  },
  {
    icon: <BarChart3 size={20} />,
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    title: "Repository Analytics",
    desc: "Deep analysis of top repositories — stars, forks, language usage, and health scoring across your entire repo portfolio.",
  },
  {
    icon: <GitCompare size={20} />,
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.1)",
    title: "Developer Comparison",
    desc: "Side-by-side radar chart comparisons of any two developers across all 6 intelligence dimensions. Perfect for hiring decisions.",
  },
  {
    icon: <Code2 size={20} />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    title: "Technology Expertise Map",
    desc: "Map languages to domains — Frontend, Backend, Systems, Data/ML, DevOps. Understand the full technical footprint at a glance.",
  },
  {
    icon: <Zap size={20} />,
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.1)",
    title: "AI-Powered Summaries",
    desc: "GPT-powered developer summaries, career assessments, technical strength analysis, and hiring recommendations.",
  },
  {
    icon: <TrendingUp size={20} />,
    color: "#F43F5E",
    bg: "rgba(244,63,94,0.1)",
    title: "Open Source Impact Score",
    desc: "Measure community influence through star accumulation, fork adoption, and follower growth — contextualized by percentile rank.",
  },
  {
    icon: <Users size={20} />,
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    title: "Career Level Detection",
    desc: "Automatically classify developers as Junior, Mid-level, Senior, or Principal based on activity signals and seniority indicators.",
  },
  {
    icon: <Trophy size={20} />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    title: "Aggregated Analytics",
    desc: "Cross-developer leaderboards, language distribution across your saved profiles, and portfolio-wide intelligence dashboards.",
  },
  {
    icon: <Shield size={20} />,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
    title: "MySQL-Powered Storage",
    desc: "Every analysis is persisted — revisit, compare over time, export reports, and manage your developer intelligence database.",
  },
];

const container = {
  animate: { transition: { staggerChildren: 0.07 } },
};
const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function FeatureCard({ feature }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", `${mx}%`);
    card.style.setProperty("--my", `${my}%`);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={item}
      className="feature-card"
      onMouseMove={handleMouseMove}
    >
      <div className="feature-icon" style={{ background: feature.bg, color: feature.color }}>
        {feature.icon}
      </div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-desc">{feature.desc}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <div className="text-center">
          <div className="section-eyebrow">⬡ Features</div>
          <h2 className="landing-section-title">
            Everything you need to<br />
            <span className="gradient-text">understand developers.</span>
          </h2>
          <p className="landing-section-sub">
            From raw GitHub data to actionable hiring intelligence — 
            DevLens surfaces what matters for every decision.
          </p>
        </div>

        <motion.div
          ref={ref}
          className="features-grid"
          variants={container}
          initial="initial"
          animate={inView ? "animate" : "initial"}
        >
          {FEATURES.map((f) => <FeatureCard key={f.title} feature={f} />)}
        </motion.div>
      </div>
    </section>
  );
}
