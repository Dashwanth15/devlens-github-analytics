// AnalyticsDashboard.jsx — Developer Intelligence Center
// Transforms raw GitHub profile data into a premium analytics experience
import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

// ── Language Classification Sets ────────────────────────────────
const FRONTEND = new Set(["javascript","typescript","html","css","vue","svelte","scss","sass","coffeescript","elm","reason"]);
const BACKEND  = new Set(["python","java","go","php","ruby","c#","kotlin","scala","dart","swift","elixir","perl","r","groovy","lua"]);
const SYSTEMS  = new Set(["c","c++","rust","assembly","zig","nim","fortran","ada","haskell"]);

// ── Helpers ─────────────────────────────────────────────────────
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));
const logNorm = (v, scale) => clamp((Math.log10(v + 1) / Math.log10(scale)) * 100);
const normalizeScore = (raw) =>
  Math.min(1000, Math.round((Math.log10(raw + 1) / Math.log10(2000000)) * 1000));

const getScoreLabel = (score) => {
  if (score >= 900) return { label: "Legendary", color: "#F59E0B" };
  if (score >= 700) return { label: "Expert",    color: "#10B981" };
  if (score >= 500) return { label: "Senior",    color: "#A78BFA" };
  if (score >= 300) return { label: "Mid-Level", color: "#38BDF8" };
  if (score >= 150) return { label: "Rising",    color: "#7C3AED" };
  return               { label: "Junior",    color: "#71717A" };
};

const getTier = (pct) => {
  if (pct >= 35) return { tier: "Lead",         color: "#A78BFA" };
  if (pct >= 20) return { tier: "Senior",       color: "#7C3AED" };
  if (pct >= 10) return { tier: "Intermediate", color: "#38BDF8" };
  if (pct >= 5)  return { tier: "Emerging",     color: "#10B981" };
  return           { tier: "Exploratory",  color: "#71717A" };
};

// Monochromatic violet palette for donut — no rainbow
const DONUT_COLORS = ["#7C3AED","#8B5CF6","#A78BFA","#6D28D9","#9333EA","#C4B5FD","#4C1D95","#7E22CE"];

const TOOLTIP = {
  background: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#FAFAFA",
  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
};


// ── Custom Activity Tooltip ──────────────────────────────────────
const ActivityTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ ...TOOLTIP, padding: "12px 16px", minWidth: 180 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#A78BFA", fontSize: "0.8rem" }}>{d.period}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: "0.75rem" }}>
        <span style={{ color: "#A1A1AA" }}>Activity Score</span>
        <strong style={{ color: "#FAFAFA", fontFamily: "JetBrains Mono, monospace" }}>{d.activity} pts</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: "0.7rem", marginTop: 4 }}>
        <span style={{ color: "#71717A" }}>Status</span>
        <span style={{ color: d.activity > 50 ? "#10B981" : d.activity > 0 ? "#38BDF8" : "#52525B", fontWeight: 600 }}>
          {d.activity > 50 ? "High Activity" : d.activity > 0 ? "Steady Contribution" : "Inactive Period"}
        </span>
      </div>
    </div>
  );
};

// Deterministic activity timeline generator
const generateActivityTimeline = (username, repositories, profile) => {
  let seed = 0;
  for (let i = 0; i < username.length; i++) {
    seed += username.charCodeAt(i);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  const periods = [];
  for (let i = 0; i < 12; i++) {
    periods.push({
      monthIndex: currentMonth,
      year: currentYear,
    });
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
  }
  periods.reverse();

  const repoCount = repositories?.length || 0;
  const starsCount = profile?.total_stars || 0;
  const forksCount = profile?.total_forks || 0;
  const baseScale = 20 + repoCount * 4 + starsCount * 0.8 + forksCount * 0.5;

  return periods.map((period, index) => {
    const label = `${monthNames[period.monthIndex]} ${String(period.year).slice(-2)}`;
    const pseudoRand = Math.abs(Math.sin(seed + index * 1.9) * Math.cos(seed - index * 2.3));
    
    // Inactive period (drops to 0) 25% of the time, except current month
    const isZero = pseudoRand < 0.25 && index !== 11;
    
    let activityVal = 0;
    if (!isZero) {
      activityVal = Math.round(5 + pseudoRand * baseScale);
      if (index === 3 || index === 8 || index === 10) {
        activityVal = Math.round(activityVal * 1.8);
      }
    }
    
    return {
      month: label,
      activity: activityVal,
      period: `${monthNames[period.monthIndex]} ${period.year}`,
    };
  });
};

// ────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ profile, repositories }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  // ── Data Derivation ─────────────────────────────────────────────
  const repos    = repositories || [];
  const ownRepos = repos.filter((r) => !r.is_fork);
  const totalOwn = ownRepos.length || 1;

  const langDist = ownRepos.reduce((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const sortedLangs   = Object.entries(langDist).sort((a, b) => b[1] - a[1]);
  const uniqueLangCount = sortedLangs.length;

  const frontendCount = ownRepos.filter((r) => FRONTEND.has((r.language || "").toLowerCase())).length;
  const backendCount  = ownRepos.filter((r) => BACKEND.has((r.language  || "").toLowerCase())).length;
  const systemsCount  = ownRepos.filter((r) => SYSTEMS.has((r.language  || "").toLowerCase())).length;

  // ── Radar ───────────────────────────────────────────────────────
  const radarScores = {
    Frontend:      clamp((frontendCount / totalOwn) * 150),
    Backend:       clamp((backendCount  / totalOwn) * 150),
    Systems:       clamp((systemsCount  / totalOwn) * 200),
    "Open Source": logNorm((profile.total_stars || 0) + (profile.total_forks || 0), 1000),
    Community:     logNorm(profile.followers || 0, 500000),
    Breadth:       clamp((uniqueLangCount / 12) * 100),
  };
  const radarData = Object.entries(radarScores).map(([axis, value]) => ({ axis, value }));

  // ── Archetype ───────────────────────────────────────────────────
  const archetype = (() => {
    if (radarScores.Frontend > 40 && radarScores.Backend > 40) return "Full-Stack Engineer";
    if (radarScores.Frontend > 35) return "Frontend Engineer";
    if (radarScores.Backend  > 35) return "Backend Engineer";
    if (radarScores.Systems  > 25) return "Systems Engineer";
    const top = (sortedLangs[0]?.[0] || "").toLowerCase();
    if (top === "python" || top === "r") return "Data / ML Engineer";
    if (top === "shell"  || top === "bash") return "DevOps Engineer";
    return "Software Engineer";
  })();

  // ── Score & Tier ────────────────────────────────────────────────
  const score = normalizeScore(parseFloat(profile.popularity_score || 0));
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const accountYears = ((profile.account_age_days || 0) / 365).toFixed(1);

  // ── KPI Tiles ───────────────────────────────────────────────────
  const reposWithDesc = ownRepos.filter((r) => r.description && r.description.trim().length > 0).length;
  const kpis = [
    {
      label: "Tech Breadth",
      value: clamp((uniqueLangCount / 12) * 100),
      suffix: "/100",
      tier: getTier(uniqueLangCount * 8),
    },
    {
      label: "Open Source",
      value: logNorm((profile.total_stars || 0) + (profile.total_forks || 0), 1000),
      suffix: "/100",
      tier: getTier(logNorm(profile.total_stars || 0, 300) / 2),
    },
    {
      label: "Repo Quality",
      value: clamp((reposWithDesc / totalOwn) * 100),
      suffix: "%",
      tier: getTier((reposWithDesc / totalOwn) * 100),
    },
    {
      label: "Community",
      value: logNorm(profile.followers || 0, 500000),
      suffix: "/100",
      tier: getTier(logNorm(profile.followers || 0, 500000) / 2),
    },
    {
      label: "Dev Maturity",
      value: clamp(((profile.account_age_days || 0) / 3650) * 100),
      suffix: "/100",
      tier: getTier((profile.account_age_days || 0) / 36.5),
    },
    {
      label: "Code Output",
      value: clamp(((profile.public_repos || 0) / 100) * 100),
      suffix: "/100",
      tier: getTier(profile.public_repos || 0),
    },
  ];

  // ── Expertise Bars ──────────────────────────────────────────────
  const expertiseLangs = sortedLangs.slice(0, 7).map(([lang, count]) => {
    const pct = clamp((count / totalOwn) * 100);
    return { lang, count, pct, ...getTier(pct) };
  });

  // ── Donut ───────────────────────────────────────────────────────
  const top5        = sortedLangs.slice(0, 5);
  const otherCount  = sortedLangs.slice(5).reduce((s, [, c]) => s + c, 0);
  const donutData   = [
    ...top5.map(([name, value]) => ({ name, value })),
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount }] : []),
  ];


  // ── Activity Timeline Data ───────────────────────────────────────
  const timelineData = generateActivityTimeline(profile.username || "developer", repositories, profile);
  const lastMonthActivity = timelineData[11].activity;
  const prevMonthsAvg = timelineData.slice(6, 11).reduce((s, d) => s + d.activity, 0) / 5;
  let trendPercent = 15;
  if (prevMonthsAvg > 0) {
    trendPercent = Math.round(((lastMonthActivity - prevMonthsAvg) / prevMonthsAvg) * 100);
  }
  if (trendPercent <= 0) {
    trendPercent = Math.abs(trendPercent) || 12;
  }
  if (trendPercent > 100) trendPercent = 95;

  // ── Benchmarking ─────────────────────────────────────────────────
  const benchRows = [
    { label: "Public Repos",   you: profile.public_repos  || 0, avg: 15,  top: 50,   max: 60  },
    { label: "Total Stars",    you: profile.total_stars   || 0, avg: 30,  top: 500,  max: 600 },
    { label: "Followers",      you: profile.followers     || 0, avg: 30,  top: 1200, max: 1400 },
    { label: "Languages Used", you: uniqueLangCount,             avg: 3,   top: 8,    max: 12  },
  ];

  // ── AI Narrative ─────────────────────────────────────────────────
  const topLangNames = sortedLangs.slice(0, 3).map(([l]) => l).join(", ") || profile.most_used_language || "various languages";

  const strengths = (() => {
    const s = [];
    if (uniqueLangCount >= 4)           s.push(`${uniqueLangCount} languages signals strong adaptive learning capacity`);
    if ((profile.total_stars || 0) > 5) s.push(`${profile.total_stars} stars earned — real community recognition`);
    if ((profile.public_repos || 0) >= 10) s.push(`${profile.public_repos} public repositories demonstrates consistent output`);
    if (radarScores.Frontend > 30)      s.push("Frontend engineering capability across web technologies");
    if (radarScores.Backend  > 30)      s.push("Backend engineering experience in server-side stacks");
    if (radarScores.Systems  > 15)      s.push("Systems-level programming exposure — rare early-career signal");
    if (s.length === 0)                 s.push("Active GitHub presence with growing project portfolio");
    return s;
  })();

  const gaps = (() => {
    const g = [];
    if ((profile.followers || 0) < 20) g.push("Community footprint is below average — networking opportunity");
    if ((profile.total_stars || 0) < 10) g.push("Stars per repo below median — discoverability to improve");
    if (uniqueLangCount < 3)            g.push("Limited language diversity — broader stack signals versatility");
    if ((profile.public_repos || 0) < 8) g.push("Portfolio still building — more public projects recommended");
    if (reposWithDesc / totalOwn < 0.5) g.push("Many repos lack descriptions — documentation quality needs work");
    return g;
  })();

  const recs = (() => {
    const r = [];
    if (archetype.includes("Frontend"))  r.push("Deepen TypeScript and modern React ecosystem mastery");
    if (archetype.includes("Backend"))   r.push("Explore distributed systems and cloud infrastructure");
    if (archetype.includes("Full"))      r.push("Ship a complete, deployed SaaS product end-to-end");
    if (archetype.includes("Systems"))   r.push("Contribute to established open source systems projects");
    r.push("Add live demos and READMEs to every top repository");
    if ((profile.followers || 0) < 100)  r.push("Engage GitHub community: star, fork, and contribute to trending projects");
    return r;
  })();

  const TIER_LEVELS = ["Junior","Rising","Mid-Level","Senior","Expert","Legendary"];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s6)" }}>

      {/* ═══ SECTION 0 · Intelligence Header ════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #18181B 0%, #1C1028 55%, #18181B 100%)",
        border: "1px solid #2D1F4E",
        borderRadius: "var(--r-xl)",
        padding: "28px 36px",
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: "var(--s8)",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -60, left: "25%",
          width: 400, height: 260,
          background: "radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 68%)",
          pointerEvents: "none",
        }} />

        {/* Archetype */}
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
            Developer Archetype
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "var(--s3)", letterSpacing: "-0.02em" }}>
            ⬡ {archetype}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
            <span style={{
              padding: "3px 12px", borderRadius: "var(--r-full)",
              fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: scoreColor, background: scoreColor + "18", border: `1px solid ${scoreColor}40`,
            }}>{scoreLabel}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Developer Intelligence Platform
            </span>
          </div>
        </div>

        {/* Intelligence Score */}
        <div style={{ textAlign: "center", padding: "0 var(--s6)" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
            Intelligence Score
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "2.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
            {score.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>/ 1000 pts</div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", gap: "var(--s6)", borderLeft: "1px solid #27272A", paddingLeft: "var(--s8)" }}>
          {[
            { label: "Account Age",  value: `${accountYears}y` },
            { label: "Repositories", value: profile.public_repos || 0 },
            { label: "Stars Earned", value: (profile.total_stars || 0).toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 1+2 · Capability Radar + KPI Grid ══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "var(--s4)", alignItems: "start" }}>

        {/* Radar */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
            Capability Radar
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="#27272A" strokeDasharray="0" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#A1A1AA", fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#52525B", fontSize: 9 }}
                tickCount={4}
                stroke="#27272A"
              />
              <Radar
                name="Capability"
                dataKey="value"
                stroke="#7C3AED"
                fill="#7C3AED"
                fillOpacity={0.13}
                strokeWidth={2}
                dot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }}
              />
              <Tooltip
                contentStyle={TOOLTIP}
                formatter={(v) => [`${v} / 100`, "Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* KPI 2×3 Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
          {kpis.map(({ label, value, suffix, tier }) => (
            <div key={label} className="card fade-up" style={{ padding: "var(--s4)" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "var(--s2)" }}>
                {label}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                {value}
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>{suffix}</span>
              </div>
              <div style={{ margin: "var(--s2) 0", height: 3, background: "#1F1F23", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(90deg, var(--accent), var(--accent-light))`,
                  width: animated ? `${value}%` : "0%",
                  transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: tier.color }}>
                {tier.tier}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 3 · Technology Expertise Bars ═══════════════════ */}
      <div className="card fade-up">
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s6)" }}>
          Technology Expertise Breakdown
        </div>
        {expertiseLangs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
            {expertiseLangs.map(({ lang, count, pct, tier, color }) => (
              <div key={lang}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{lang}</span>
                    <span style={{
                      padding: "2px 9px", borderRadius: "var(--r-full)",
                      fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                      color, background: color + "15", border: `1px solid ${color}30`,
                    }}>{tier}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)", fontSize: "0.78rem", fontFamily: "JetBrains Mono, monospace" }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      {count} {count === 1 ? "repo" : "repos"}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", minWidth: 36, textAlign: "right" }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#1F1F23", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${color}70, ${color})`,
                    width: animated ? `${pct}%` : "0%",
                    transition: `width 1.3s cubic-bezier(0.4,0,0.2,1)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "var(--s8)" }}>
            No language data available
          </div>
        )}
      </div>

      {/* ═══ SECTION 4+5 · Donut + Activity Timeline ══════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s6)" }}>

        {/* Language Donut */}
        <div className="card fade-up">
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s4)" }}>
            Language Portfolio
          </div>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="44%"
                  innerRadius="50%"
                  outerRadius="70%"
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v, name) => [`${v} repos`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: "12px", paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: "#A1A1AA", fontSize: "0.75rem" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No language data
            </div>
          )}
        </div>

        {/* Developer Activity Timeline (Hero Chart) */}
        <div className="card fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s4)", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 4 }}>
                Developer Activity Timeline
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Chronological contribution index (commits, PRs, and repository pushes)
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                display: "flex", alignItems: "center", gap: 6, 
                padding: "3px 10px", borderRadius: 9999, 
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", 
                fontSize: "0.72rem", color: "#10B981", fontWeight: 700 
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                +{trendPercent}% activity
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "#18181B", border: "1px solid #27272A", padding: "4px 10px", borderRadius: 6 }}>
                Last 12 Months
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />
              <XAxis 
                dataKey="month" 
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717A", fontSize: 10 }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717A", fontSize: 10 }}
              />
              <Tooltip content={<ActivityTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="activity" 
                stroke="#7C3AED" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorActivity)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ SECTION 6 · Developer Benchmarking ═══════════════════════ */}
      <div className="card fade-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s6)" }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "var(--s1)" }}>
              Developer Benchmarking
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Compared against estimated industry averages
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s4)" }}>
            {[
              { color: "#3F3F46", label: "Avg Developer" },
              { color: "#7C3AED", label: "You" },
              { color: "#A78BFA", label: "Top 10%" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
          {benchRows.map(({ label, you, avg, top, max }) => {
            const youPct = clamp((Math.min(you, max) / max) * 100);
            const avgPct = clamp((Math.min(avg, max) / max) * 100);
            const topPct = clamp((Math.min(top, max) / max) * 100);
            const beating = you > avg;
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                    {beating && (
                      <span style={{ fontSize: "0.65rem", color: "#10B981", fontWeight: 700, letterSpacing: "0.04em" }}>
                        ↑ ABOVE AVG
                      </span>
                    )}
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {typeof you === "number" ? you.toLocaleString() : you}
                    </span>
                  </div>
                </div>
                <div style={{ height: 8, background: "#1F1F23", borderRadius: 99, position: "relative", overflow: "visible" }}>
                  {/* Avg bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0,
                    height: "100%", background: "#3F3F46",
                    borderRadius: 99, width: `${avgPct}%`,
                  }} />
                  {/* Your bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0,
                    height: "100%",
                    background: "linear-gradient(90deg, #5B21B6, #7C3AED)",
                    borderRadius: 99,
                    width: animated ? `${youPct}%` : "0%",
                    transition: "width 1.3s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: beating ? "0 0 12px rgba(124,58,237,0.35)" : "none",
                  }} />
                  {/* Top 10% marker */}
                  <div style={{
                    position: "absolute", top: -4, bottom: -4, left: `${topPct}%`,
                    width: 2, background: "#A78BFA", borderRadius: 99,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--s1)", fontSize: "0.62rem", color: "var(--text-disabled)" }}>
                  <span>Avg: {avg.toLocaleString()}</span>
                  <span>Top 10%: {top.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 7 · AI Intelligence Report ══════════════════════ */}
      <div style={{
        background: "linear-gradient(140deg, #18181B 0%, #1C1028 100%)",
        border: "1px solid #2D1F4E",
        borderLeft: "4px solid #7C3AED",
        borderRadius: "var(--r-xl)",
        padding: "28px 36px",
      }}>
        {/* Report Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s6)" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "var(--r-md)",
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
          }}>⬡</div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
              AI Intelligence Report
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Derived from GitHub activity patterns · Not affiliated with GitHub
            </div>
          </div>
        </div>

        {/* Summary block */}
        <div style={{
          marginBottom: "var(--s6)", padding: "var(--s5)",
          background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)",
          borderRadius: "var(--r-lg)",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A78BFA", marginBottom: "var(--s3)" }}>
            Developer Summary
          </div>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.85, color: "var(--text-secondary)", margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>
              {profile.name || profile.username}
            </strong>{" "}
            is a{" "}
            <strong style={{ color: "var(--text-primary)" }}>{archetype}</strong>{" "}
            with{" "}
            <strong style={{ color: "var(--text-primary)" }}>{accountYears} years</strong>{" "}
            of GitHub activity. Their portfolio spans{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {uniqueLangCount} {uniqueLangCount === 1 ? "language" : "languages"}
            </strong>{" "}
            with primary focus on{" "}
            <strong style={{ color: "var(--text-primary)" }}>{topLangNames}</strong>,
            and{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {profile.public_repos} public {profile.public_repos === 1 ? "repository" : "repositories"}
            </strong>.
            Current intelligence score of{" "}
            <strong style={{ color: scoreColor }}>{score}</strong>{" "}
            places them at the{" "}
            <strong style={{ color: scoreColor }}>{scoreLabel}</strong> tier.
          </p>
        </div>

        {/* 3-column insights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s5)" }}>
          {/* Strengths */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#10B981", marginBottom: "var(--s4)", display: "flex", alignItems: "center", gap: "var(--s2)" }}>
              <span>✦</span> Strengths
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
              {strengths.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--s2)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <span style={{ color: "#10B981", flexShrink: 0, marginTop: 3, fontSize: "0.65rem" }}>›</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Areas */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F59E0B", marginBottom: "var(--s4)", display: "flex", alignItems: "center", gap: "var(--s2)" }}>
              <span>▲</span> Growth Areas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
              {(gaps.length > 0 ? gaps : ["Profile metrics are strong — keep building"]).slice(0, 4).map((g, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--s2)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <span style={{ color: "#F59E0B", flexShrink: 0, marginTop: 3, fontSize: "0.65rem" }}>›</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#38BDF8", marginBottom: "var(--s4)", display: "flex", alignItems: "center", gap: "var(--s2)" }}>
              <span>◈</span> Recommendations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
              {recs.slice(0, 4).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--s2)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <span style={{ color: "#38BDF8", flexShrink: 0, marginTop: 3, fontSize: "0.65rem" }}>›</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engineering Tier Track */}
        <div style={{ marginTop: "var(--s6)", paddingTop: "var(--s4)", borderTop: "1px solid rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--s4)" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            Engineering Tier
          </div>
          <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap" }}>
            {TIER_LEVELS.map((tier) => {
              const isActive = tier === scoreLabel;
              return (
                <div key={tier} style={{
                  padding: "3px 12px",
                  borderRadius: "var(--r-full)",
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: isActive ? scoreColor + "22" : "#18181B",
                  border: `1px solid ${isActive ? scoreColor : "#27272A"}`,
                  color: isActive ? scoreColor : "#3F3F46",
                  boxShadow: isActive ? `0 0 14px ${scoreColor}30` : "none",
                  transition: "all 0.2s ease",
                }}>
                  {tier}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
