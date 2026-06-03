// HowItWorks.jsx — Animated 5-step workflow
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, Cpu, Lightbulb, BarChart2, Download } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: <Search size={22} />,
    title: "Enter GitHub Username",
    desc: "Paste any username or full GitHub URL — DevLens auto-extracts it.",
    color: "#7C3AED",
  },
  {
    n: "02",
    icon: <Cpu size={22} />,
    title: "Analyze Profile",
    desc: "We fetch live GitHub data — profile, repositories, languages, stars, forks.",
    color: "#38BDF8",
  },
  {
    n: "03",
    icon: <Lightbulb size={22} />,
    title: "Generate Intelligence",
    desc: "Compute scores, career level, domain expertise, and impact metrics.",
    color: "#10B981",
  },
  {
    n: "04",
    icon: <BarChart2 size={22} />,
    title: "Explore Analytics",
    desc: "Radar charts, language maps, leaderboards, and side-by-side comparisons.",
    color: "#F59E0B",
  },
  {
    n: "05",
    icon: <Download size={22} />,
    title: "Share & Export",
    desc: "Copy shareable links, export reports, or bookmark developers for later.",
    color: "#A78BFA",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how" className="landing-section" style={{ background: "rgba(255,255,255,0.01)" }}>
      <div className="landing-container">
        <div className="text-center">
          <div className="section-eyebrow">⚡ Workflow</div>
          <h2 className="landing-section-title">From username to<br /><span className="gradient-text">intelligence in 5 steps.</span></h2>
          <p className="landing-section-sub">No configuration. No sign-up required. Just type and analyze.</p>
        </div>

        <div ref={ref} className="steps-grid">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              className="step-item"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="step-number" style={{ background: `rgba(${hexToRgb(step.color)},0.1)`, borderColor: `rgba(${hexToRgb(step.color)},0.3)`, color: step.color }}>
                {step.n}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(${hexToRgb(step.color)},0.1)`, border: `1px solid rgba(${hexToRgb(step.color)},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, margin: "0 auto 14px" }}>
                {step.icon}
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
