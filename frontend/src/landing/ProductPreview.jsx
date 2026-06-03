// ProductPreview.jsx — Dashboard mockup screenshot section
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

const RADAR_DATA = [
  { dim: "Community",  val: 12 },
  { dim: "Stars",      val: 10 },
  { dim: "Forks",      val: 5  },
  { dim: "Repos",      val: 30 },
  { dim: "Seniority",  val: 20 },
  { dim: "Score",      val: 22 },
];

const LANG_DIST = [
  { lang: "JavaScript", pct: 30, color: "#f1e05a" },
  { lang: "HTML",       pct: 20, color: "#e34c26" },
  { lang: "TypeScript", pct: 10, color: "#3178c6" },
  { lang: "Python",     pct: 10, color: "#3572A5" },
  { lang: "PHP",        pct: 10, color: "#4F5D95" },
  { lang: "C++",        pct: 10, color: "#f34b7d" },
  { lang: "CSS",        pct: 10, color: "#563d7c" },
];

export default function ProductPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="preview" className="landing-section" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 48 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="preview-wrapper">
            {/* Browser chrome */}
            <div className="preview-bar">
              <div className="preview-dot" style={{ background: "#F43F5E" }} />
              <div className="preview-dot" style={{ background: "#F59E0B" }} />
              <div className="preview-dot" style={{ background: "#10B981" }} />
              <div className="preview-url">app.devlens.io/profile/dashwanth15</div>
            </div>

            {/* Mock Dashboard */}
            <div className="preview-body">
              {/* Profile hero */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24, padding: "16px 20px", background: "rgba(24,24,27,0.6)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                <img src="https://avatars.githubusercontent.com/dashwanth15" alt="dashwanth15" style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.4)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em" }}>Dashwanth Madduri</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", color: "#A78BFA", fontSize: "0.85rem", marginBottom: 8 }}>@dashwanth15</div>
                  <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "#71717A" }}>
                    <span>🎓 Woxsen University</span>
                    <span>📍 Hyderabad, IN</span>
                    <span><strong style={{ color: "#FAFAFA" }}>5</strong> followers</span>
                    <span><strong style={{ color: "#FAFAFA" }}>5</strong> stars</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#7C3AED", padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600 }}>Junior</div>
                  <div style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#71717A", padding: "4px 12px", borderRadius: 8, fontSize: "0.75rem" }}>🔗 Share</div>
                </div>
              </div>

              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { l: "Repos",     v: "15"   },
                  { l: "Stars",     v: "5"    },
                  { l: "Forks",     v: "0"    },
                  { l: "Followers", v: "5"    },
                  { l: "Gists",     v: "0"    },
                  { l: "Age",       v: "0.9y" },
                ].map((s) => (
                  <div key={s.l} style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.15rem", fontWeight: 700, color: "#FAFAFA" }}>{s.v}</div>
                    <div style={{ fontSize: "0.68rem", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Bottom two columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Radar */}
                <div style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 8 }}>Intelligence Score</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "2.4rem", fontWeight: 900, background: "linear-gradient(135deg, #7C3AED, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>225</div>
                    <div style={{ flex: 1 }}>
                      <ResponsiveContainer width="100%" height={120}>
                        <RadarChart data={RADAR_DATA}>
                          <PolarGrid stroke="rgba(255,255,255,0.05)" />
                          <PolarAngleAxis dataKey="dim" tick={{ fill: "#52525B", fontSize: 9 }} />
                          <Radar dataKey="val" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Language + repos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px", flex: 1 }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525B", marginBottom: 10 }}>Language Distribution</div>
                    <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", gap: 2, marginBottom: 10 }}>
                      {LANG_DIST.map((l) => <div key={l.lang} style={{ flex: l.pct, background: l.color, borderRadius: 2 }} />)}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {LANG_DIST.map((l) => (
                        <div key={l.lang} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "#71717A" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                          {l.lang} <span style={{ color: "#52525B" }}>{l.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C3AED", animation: "pulse-dot 2s infinite" }} />
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A78BFA" }}>AI Developer Summary</div>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#71717A", lineHeight: 1.6 }}>
                      <span style={{ color: "#FAFAFA", fontWeight: 600 }}>Full-Stack Engineer</span> — JavaScript, HTML, TypeScript & Python stack. MERN learner building real-world projects. Rising developer with 15 public repos.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
