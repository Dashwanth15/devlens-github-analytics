// LanguageChart.jsx — GitHub-style language distribution
const LANG_COLORS = {
  JavaScript:"#f1e05a", TypeScript:"#3178c6", Python:"#3572A5",
  Java:"#b07219", C:"#555555", "C++":"#f34b7d", "C#":"#178600",
  Go:"#00ADD8", Rust:"#dea584", Ruby:"#701516", PHP:"#4F5D95",
  Swift:"#F05138", Kotlin:"#A97BFF", HTML:"#e34c26", CSS:"#563d7c",
  Shell:"#89e051", Vue:"#41b883", Dart:"#00B4AB", OpenSCAD:"#e5cd31",
  Makefile:"#427819", SCSS:"#c6538c", Less:"#1d365d",
};
const getColor = (lang, idx) =>
  LANG_COLORS[lang] || `hsl(${(idx * 67) % 360}, 65%, 55%)`;

export default function LanguageChart({ distribution }) {
  if (!distribution || Object.keys(distribution).length === 0) return null;

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card fade-up">
      <div style={{ marginBottom: "var(--s4)" }}>
        <div className="section-title">Language Distribution</div>
      </div>
      <div className="lang-bar" style={{ marginBottom: "var(--s5)" }}>
        {sorted.map(([lang, count], idx) => (
          <div
            key={lang}
            className="lang-bar-seg"
            title={`${lang}: ${((count / total) * 100).toFixed(1)}%`}
            style={{
              flex: count,
              background: getColor(lang, idx),
              minWidth: "4px",
            }}
          />
        ))}
      </div>
      <div className="lang-legend">
        {sorted.map(([lang, count], idx) => (
          <div className="lang-legend-item" key={lang}>
            <div className="lang-swatch" style={{ background: getColor(lang, idx) }} />
            <span style={{ fontWeight: 500 }}>{lang}</span>
            <span style={{ color: "var(--text-muted)" }}>
              {((count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
