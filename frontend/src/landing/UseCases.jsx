// UseCases.jsx — Persona-based use case cards
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CASES = [
  {
    icon: "🧑‍💼",
    color: "#7C3AED",
    title: "Recruiters",
    desc: "Evaluate candidate technical depth in minutes, not days.",
    bullets: ["Intelligence score at a glance", "Language expertise map", "Career level detection", "Shareable reports for hiring managers"],
  },
  {
    icon: "👨‍💻",
    color: "#10B981",
    title: "Engineering Managers",
    desc: "Benchmark candidates and understand technical footprints.",
    bullets: ["Radar chart comparison", "Open source track record", "Repository health signals", "Team technology alignment"],
  },
  {
    icon: "🚀",
    color: "#F59E0B",
    title: "Startup Founders",
    desc: "Technical due diligence on engineering hires in seconds.",
    bullets: ["Quick profile scanning", "Impact vs. output balance", "Collaboration signals", "Seniority verification"],
  },
  {
    icon: "🎓",
    color: "#38BDF8",
    title: "Developers",
    desc: "Understand your own GitHub presence and growth trajectory.",
    bullets: ["Self-assessment score", "Compare with industry peers", "Identify growth areas", "Share portfolio link"],
  },
  {
    icon: "📚",
    color: "#A78BFA",
    title: "Students",
    desc: "Benchmark your GitHub profile against senior engineers.",
    bullets: ["See what experts look like", "Set improvement goals", "Track profile growth", "Build portfolio confidence"],
  },
  {
    icon: "🏢",
    color: "#F43F5E",
    title: "Organizations",
    desc: "Analyze open source contributors and community leaders.",
    bullets: ["Organization-wide analysis", "Contributor intelligence", "Technology stack mapping", "Community influence scoring"],
  },
];

export default function UseCases() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="text-center">
          <div className="section-eyebrow">👤 Use Cases</div>
          <h2 className="landing-section-title">Built for every<br /><span className="gradient-text">engineering decision.</span></h2>
          <p className="landing-section-sub">Whether you're hiring, being hired, or growing — DevLens has your insight layer.</p>
        </div>

        <div ref={ref} className="usecase-grid">
          {CASES.map((c, i) => (
            <motion.div
              key={c.title}
              className="usecase-card"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="usecase-icon">{c.icon}</div>
              <h3 className="usecase-title">{c.title}</h3>
              <p className="usecase-desc">{c.desc}</p>
              <ul className="usecase-bullets">
                {c.bullets.map((b) => <li key={b} className="usecase-bullet">{b}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
