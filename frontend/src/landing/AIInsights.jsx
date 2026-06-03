// AIInsights.jsx — Premium AI section
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";

const AI_CARDS = [
  {
    type: "Developer Summary",
    color: "#7C3AED",
    content: (
      <>
        <span style={{ color: "#FAFAFA", fontWeight: 600 }}>Senior Full-Stack Engineer</span> with 8+ years on GitHub.
        Specializes in <span style={{ color: "#A78BFA" }}>TypeScript</span> and <span style={{ color: "#38BDF8" }}>React</span>.
        Strong open-source contributor with <span style={{ color: "#F59E0B" }}>4.2k stars</span> earned. 
        Positioned for <span style={{ color: "#10B981" }}>Staff Engineer</span> roles.
      </>
    ),
    chips: ["Open Source", "TypeScript Expert", "React Ecosystem"],
  },
  {
    type: "Career Assessment",
    color: "#10B981",
    content: (
      <>
        Career trajectory shows <span style={{ color: "#FAFAFA", fontWeight: 600 }}>consistent growth</span> over 6 years.
        Account age and repository diversity suggest <span style={{ color: "#10B981" }}>mid-senior level</span> experience.
        Community influence is in the <span style={{ color: "#F59E0B" }}>top 15%</span> of analyzed profiles.
      </>
    ),
    chips: ["Mid-Senior", "Growing Influence", "Community Leader"],
  },
  {
    type: "Hiring Recommendation",
    color: "#F59E0B",
    content: (
      <>
        <span style={{ color: "#FAFAFA", fontWeight: 600 }}>Strong hire signal.</span> Technical depth in frontend systems,
        consistent commit history, and proven open-source delivery.
        Recommend for <span style={{ color: "#A78BFA" }}>Senior Frontend / Tech Lead</span> roles.
        Interview focus: <span style={{ color: "#38BDF8" }}>architecture decisions</span>.
      </>
    ),
    chips: ["Strong Signal", "Tech Lead", "Architecture Focus"],
  },
];

export default function AIInsights() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" style={{ background: "rgba(124,58,237,0.02)", borderTop: "1px solid rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.08)" }}>
      <div className="landing-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left text */}
          <div>
            <div className="section-eyebrow"><Sparkles size={12} /> AI Intelligence</div>
            <h2 className="landing-section-title">
              Developer insights<br />
              <span className="gradient-text">powered by AI.</span>
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#71717A", lineHeight: 1.8, marginBottom: 28 }}>
              DevLens feeds structured GitHub data into GPT-4 to generate professional developer assessments — in seconds, not hours.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["🧠", "AI Developer Summary", "Plain-English profile description"],
                ["📋", "Career Assessment", "Experience level and trajectory"],
                ["💼", "Hiring Recommendation", "Role fit and interview guidance"],
                ["📊", "Strength Analysis", "Technical and soft skill signals"],
              ].map(([icon, label, sub]) => (
                <li key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#FAFAFA", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: "0.8rem", color: "#52525B" }}>{sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — AI cards */}
          <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {AI_CARDS.map((card, i) => (
              <motion.div
                key={card.type}
                className="ai-card"
                initial={{ opacity: 0, x: 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ai-header">
                  <div className="ai-dot" style={{ background: card.color }} />
                  <div className="ai-label">{card.type}</div>
                  <Sparkles size={12} style={{ color: card.color, marginLeft: "auto" }} />
                </div>
                <p className="ai-text">{card.content}</p>
                <div className="ai-chips">
                  {card.chips.map((c) => <span key={c} className="ai-chip" style={{ borderColor: `rgba(${hexToRgb(card.color)},0.3)`, color: card.color, background: `rgba(${hexToRgb(card.color)},0.08)` }}>{c}</span>)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
