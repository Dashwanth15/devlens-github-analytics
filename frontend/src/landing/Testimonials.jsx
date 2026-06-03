// Testimonials.jsx — Social proof cards
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "DevLens cut our technical screening time by 60%. The intelligence score gives me an instant signal before I even look at a resume.",
    name: "Priya Mehta",
    role: "Engineering Recruiter @ Razorpay",
    avatar: "PM",
    avatarBg: "#7C3AED",
    stars: 5,
  },
  {
    quote: "I used this to compare myself against senior engineers and found exactly where I needed to level up. The radar chart breakdown is eye-opening.",
    name: "Arjun Kapoor",
    role: "Software Engineer @ Atlassian",
    avatar: "AK",
    avatarBg: "#10B981",
    stars: 5,
  },
  {
    quote: "The AI developer summary is scary accurate. Showed it to a candidate and they were impressed — it captured nuances I missed in a 30-min call.",
    name: "Sarah Chen",
    role: "Engineering Manager @ Stripe",
    avatar: "SC",
    avatarBg: "#38BDF8",
    stars: 5,
  },
  {
    quote: "We use DevLens for all technical due-diligence on founding engineer candidates. The career level detection saves us 2–3 hours per candidate.",
    name: "Rahul Verma",
    role: "Founder @ Y Combinator W24",
    avatar: "RV",
    avatarBg: "#F59E0B",
    stars: 5,
  },
  {
    quote: "The language distribution and technology expertise map are exactly what I needed to benchmark our open source contributors.",
    name: "Mia Johnson",
    role: "OSS Program Manager @ Google",
    avatar: "MJ",
    avatarBg: "#F43F5E",
    stars: 5,
  },
  {
    quote: "As a student, seeing how Linus Torvalds' profile looks on DevLens vs mine was humbling and incredibly motivating. This is a proper tool.",
    name: "Dev Sharma",
    role: "CS Student @ IIT Bombay",
    avatar: "DS",
    avatarBg: "#A78BFA",
    stars: 5,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" style={{ background: "rgba(255,255,255,0.01)" }}>
      <div className="landing-container">
        <div className="text-center">
          <div className="section-eyebrow">💬 Testimonials</div>
          <h2 className="landing-section-title">Trusted by builders<br /><span className="gradient-text">and hiring teams.</span></h2>
        </div>

        <div ref={ref} className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: t.avatarBg }}>{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
