// Skeleton.jsx — Loading skeleton components
export const SkeletonText = ({ width = "100%", height = 14 }) => (
  <div className="skeleton skeleton-text" style={{ width, height }} />
);

export const SkeletonAvatar = () => (
  <div className="skeleton skeleton-avatar" />
);

export const SkeletonCard = ({ height = 120 }) => (
  <div className="skeleton" style={{ height, borderRadius: "var(--r-xl)" }} />
);

export const SkeletonProfileHero = () => (
  <div className="card">
    <div className="profile-hero">
      <SkeletonAvatar />
      <div style={{ flex: 1 }}>
        <SkeletonText width="200px" height={28} />
        <div style={{ marginTop: 8 }}><SkeletonText width="140px" height={16} /></div>
        <div style={{ marginTop: 12 }}><SkeletonText width="380px" /></div>
        <div style={{ marginTop: 4 }}><SkeletonText width="320px" /></div>
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <SkeletonText width="80px" />
          <SkeletonText width="80px" />
          <SkeletonText width="80px" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonStatGrid = () => (
  <div className="stat-grid">
    {[...Array(6)].map((_, i) => (
      <SkeletonCard key={i} height={90} />
    ))}
  </div>
);

export const SkeletonRepoList = () => (
  <div className="card">
    <SkeletonText width="160px" height={20} />
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: "var(--r-lg)", padding: "16px" }}>
          <SkeletonText width="180px" height={16} />
          <div style={{ marginTop: 8 }}><SkeletonText width="320px" /></div>
          <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
            <SkeletonText width="60px" />
            <SkeletonText width="60px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
