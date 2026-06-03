// CTASection.jsx — High-converting final CTA
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-glow" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow" style={{ margin: "0 auto var(--s5)" }}>
            <Zap size={12} /> Ready to start?
          </div>
          <h2 className="cta-title">
            Start analyzing developers<br />
            <span className="gradient-text">smarter, faster, deeper.</span>
          </h2>
          <p className="cta-sub">
            No sign-up. No API key. No limits on your first 5 profiles. 
            Just intelligence.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg"
              style={{ fontSize: "1rem", padding: "14px 32px", gap: 10 }}
              onClick={() => navigate("/discover")}
            >
              <Zap size={20} /> Launch DevLens <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-secondary btn-lg"
              style={{ fontSize: "1rem", padding: "14px 32px" }}
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard →
            </motion.button>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 36, fontSize: "0.8rem", color: "#3F3F46" }}>
            <span>✓ Free to use</span>
            <span>✓ No sign-up required</span>
            <span>✓ GitHub API powered</span>
            <span>✓ MySQL persisted</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
