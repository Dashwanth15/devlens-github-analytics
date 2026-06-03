// StatsSection.jsx — Animated counter stats
import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

const STATS = [
  { end: 50000, label: "Profiles Analyzed",      suffix: "+",  decimals: 0 },
  { end: 2.4,   label: "Repositories Indexed",   suffix: "M+", decimals: 1 },
  { end: 847,   label: "Million Stars Processed", suffix: "M+", decimals: 0 },
  { end: 200,   label: "Languages Tracked",       suffix: "+",  decimals: 0 },
];

function useCountUp(end, duration = 1800, inView, decimals = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(end);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration, decimals]);

  return count;
}

function StatItem({ stat, inView, i }) {
  const count = useCountUp(stat.end, 1800 + i * 200, inView, stat.decimals);
  return (
    <div className="stat-item">
      <div className="stat-number">{stat.decimals > 0 ? count.toFixed(stat.decimals) : Math.round(count).toLocaleString()}{stat.suffix}</div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section-sm">
      <div className="landing-container">
        <div ref={ref} className="stats-row">
          {STATS.map((s, i) => <StatItem key={s.label} stat={s} inView={inView} i={i} />)}
        </div>
      </div>
    </section>
  );
}
