import { useState, useEffect } from "react";
import {
  createCampaign, getAllCampaigns, getCampaign,
  deleteCampaign, addCandidate, removeCandidate, rankCampaign,
} from "../api/rankingApi";
import { extractUsername } from "../utils/github";

const STATUS_META = {
  draft:     { label: "Draft",     color: "#94a3b8", dot: "#94a3b8" },
  analyzing: { label: "Analyzing", color: "#f59e0b", dot: "#f59e0b" },
  complete:  { label: "Complete",  color: "#10b981", dot: "#10b981" },
};

const ANALYSIS_STATUS = {
  pending:   { color: "#94a3b8" },
  analyzing: { color: "#f59e0b" },
  complete:  { color: "#10b981" },
  error:     { color: "#ef4444" },
};

function RankBadge({ rank }) {
  const colors = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c3a" };
  const color = colors[rank] || "var(--text-muted)";
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
      background: rank <= 3 ? `${color}20` : "var(--bg-secondary)",
      border: `2px solid ${rank <= 3 ? color : "var(--border-primary)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: rank <= 3 ? "0.9rem" : "0.8rem",
      color: rank <= 3 ? color : "var(--text-muted)",
    }}>
      {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
    </div>
  );
}

function ScoreBar({ score, color = "#6366f1" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-secondary)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`, borderRadius: 99,
          background: score >= 70 ? "#10b981" : score >= 50 ? color : "#f59e0b",
          transition: "width 0.8s ease",
        }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)",
        minWidth: 32, textAlign: "right" }}>{Math.round(score)}%</span>
    </div>
  );
}

function CreateCampaignModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!title.trim()) return setError("Campaign title is required.");
    if (!jd.trim() || jd.trim().length < 50) return setError("Job description must be at least 50 characters.");
    setLoading(true);
    setError(null);
    try {
      const res = await createCampaign(title.trim(), role.trim(), jd.trim());
      onCreate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "var(--s4)",
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh",
        overflow: "auto", background: "var(--bg-card)" }}>
        <div className="card-header" style={{ marginBottom: "var(--s4)" }}>
          <h3 className="card-title" style={{ fontSize: "1.1rem" }}>New Ranking Campaign</h3>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>CAMPAIGN NAME *</label>
            <input className="input" placeholder="e.g. Senior Frontend Engineer — Q3 2026"
              value={title} onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>ROLE NAME</label>
            <input className="input" placeholder="e.g. Senior Frontend Engineer"
              value={role} onChange={(e) => setRole(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
              letterSpacing: "0.08em", display: "block", marginBottom: "var(--s2)" }}>JOB DESCRIPTION *</label>
            <textarea className="input" placeholder="Paste the full job description..."
              value={jd} onChange={(e) => setJd(e.target.value)}
              style={{ width: "100%", minHeight: 160, boxSizing: "border-box",
                resize: "vertical", fontFamily: "inherit", fontSize: "0.8rem", lineHeight: 1.6 }} />
          </div>

          {error && (
            <div style={{ padding: "var(--s2) var(--s3)", background: "rgba(239,68,68,0.1)",
              borderRadius: "var(--radius-md)", color: "#ef4444", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <button onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? "Creating…" : "Create Campaign"}
            </button>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingRank, setLoadingRank] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState(null);
  const [rankError, setRankError] = useState(null);

  const loadCampaigns = async () => {
    try {
      const res = await getAllCampaigns();
      setCampaigns(res.data || []);
    } catch { setCampaigns([]); }
    finally { setLoadingCampaigns(false); }
  };

  const loadCampaign = async (id) => {
    try {
      const res = await getCampaign(id);
      setActiveCampaign(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    getAllCampaigns()
      .then((res) => {
        setCampaigns(res.data || []);
        setLoadingCampaigns(false);
      })
      .catch(() => {
        setCampaigns([]);
        setLoadingCampaigns(false);
      });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign and all its rankings?")) return;
    await deleteCampaign(id);
    setCampaigns((c) => c.filter((x) => x.id !== id));
    if (activeCampaign?.id === id) setActiveCampaign(null);
  };

  const handleAddCandidate = async () => {
    const cleanUsername = extractUsername(newUsername);
    if (!cleanUsername || !activeCampaign) return;
    setAddingUser(true);
    setAddError(null);
    try {
      await addCandidate(activeCampaign.id, cleanUsername);
      await loadCampaign(activeCampaign.id);
      setNewUsername("");
    } catch (err) {
      setAddError(err.response?.data?.message || err.message);
    } finally { setAddingUser(false); }
  };

  const handleRemoveCandidate = async (username) => {
    if (!activeCampaign) return;
    await removeCandidate(activeCampaign.id, username);
    await loadCampaign(activeCampaign.id);
  };

  const handleRank = async () => {
    if (!activeCampaign) return;
    setLoadingRank(true);
    setRankError(null);
    try {
      const res = await rankCampaign(activeCampaign.id);
      setActiveCampaign(res.data);
      await loadCampaigns();
    } catch (err) {
      setRankError(err.response?.data?.message || "Ranking failed. Check that all candidates have analyzed profiles.");
    } finally { setLoadingRank(false); }
  };

  const rankedCandidates = activeCampaign?.candidates
    ?.filter((c) => c.rank_position)
    .sort((a, b) => a.rank_position - b.rank_position) || [];
  const unrankedCandidates = activeCampaign?.candidates
    ?.filter((c) => !c.rank_position) || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidate Ranking</h1>
          <p className="page-subtitle">
            Create recruiting campaigns, add candidates, and rank them with a multi-signal scoring engine.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + New Campaign
        </button>
      </div>

      {showModal && (
        <CreateCampaignModal
          onClose={() => setShowModal(false)}
          onCreate={(campaign) => {
            setCampaigns((c) => [campaign, ...c]);
            setActiveCampaign(campaign);
          }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "var(--s4)", alignItems: "start" }}>

        {/* ── Campaign Sidebar ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
            letterSpacing: "0.08em", padding: "0 var(--s1)" }}>
            CAMPAIGNS ({campaigns.length})
          </div>

          {loadingCampaigns && (
            <div style={{ textAlign: "center", padding: "var(--s8)", color: "var(--text-muted)" }}>
              Loading…
            </div>
          )}

          {!loadingCampaigns && campaigns.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "var(--s8)", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "var(--s2)" }}>🏆</div>
              <div style={{ fontSize: "0.875rem" }}>No campaigns yet</div>
              <div style={{ fontSize: "0.75rem", marginTop: "var(--s1)" }}>
                Create your first campaign
              </div>
            </div>
          )}

          {campaigns.map((c) => {
            const meta = STATUS_META[c.status] || STATUS_META.draft;
            const isActive = activeCampaign?.id === c.id;
            return (
              <div key={c.id}
                onClick={() => loadCampaign(c.id)}
                style={{
                  padding: "var(--s3) var(--s4)", borderRadius: "var(--radius-lg)", cursor: "pointer",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-primary)"}`,
                  transition: "all 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "var(--s1)" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "var(--s2)" }}>
                    {c.title}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)",
                      cursor: "pointer", padding: 0, fontSize: "0.8rem", flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />
                  <span style={{ fontSize: "0.7rem", color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                  {c.candidate_count > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      · {c.candidate_count} candidates
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Main Campaign View ────────────────────────────── */}
        {!activeCampaign ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: 400, flexDirection: "column", gap: "var(--s4)", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem" }}>🏆</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Select or create a campaign to start ranking
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Create Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>

            {/* Campaign header */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600,
                    letterSpacing: "0.08em", marginBottom: "var(--s1)" }}>CAMPAIGN</div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)",
                    margin: 0, marginBottom: "var(--s2)" }}>{activeCampaign.title}</h2>
                  {activeCampaign.role_name && (
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      Role: <strong>{activeCampaign.role_name}</strong>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "var(--s2)" }}>
                  <button onClick={handleRank} disabled={loadingRank ||
                    (activeCampaign.candidates?.length || 0) === 0}
                    className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                    {loadingRank ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                        Ranking…
                      </span>
                    ) : "⚡ Run Ranking"}
                  </button>
                </div>
              </div>

              {rankError && (
                <div style={{ marginTop: "var(--s3)", padding: "var(--s2) var(--s3)",
                  background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-md)",
                  color: "#ef4444", fontSize: "0.8rem" }}>
                  {rankError}
                </div>
              )}
            </div>

            {/* Add candidate */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Add Candidate</h3>
              </div>
              <div style={{ display: "flex", gap: "var(--s3)" }}>
                <input className="input" placeholder="GitHub username"
                  value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCandidate()}
                  style={{ flex: 1 }} />
                <button onClick={handleAddCandidate} disabled={addingUser || !newUsername.trim()}
                  className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                  {addingUser ? "Adding…" : "+ Add"}
                </button>
              </div>
              {addError && (
                <div style={{ marginTop: "var(--s2)", fontSize: "0.8rem", color: "#ef4444" }}>{addError}</div>
              )}
            </div>

            {/* Ranked leaderboard */}
            {rankedCandidates.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">🏆 Ranking Leaderboard</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {rankedCandidates.length} candidates ranked
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                  {rankedCandidates.map((c) => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", gap: "var(--s4)",
                      padding: "var(--s3) var(--s4)", borderRadius: "var(--radius-lg)",
                      background: c.rank_position === 1 ? "rgba(245,158,11,0.06)" : "var(--bg-secondary)",
                      border: `1px solid ${c.rank_position === 1 ? "rgba(245,158,11,0.2)" : "var(--border-primary)"}`,
                    }}>
                      <RankBadge rank={c.rank_position} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)",
                          fontSize: "0.9rem", marginBottom: "var(--s1)" }}>
                          {c.username}
                        </div>
                        {c.score_breakdown && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                            gap: "var(--s2) var(--s4)", fontSize: "0.7rem" }}>
                            {Object.entries(c.score_breakdown).slice(0, 6).map(([key, val]) => (
                              <div key={key}>
                                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>{val.label}</div>
                                <ScoreBar score={val.score} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800,
                          color: c.composite_score >= 70 ? "#10b981" : c.composite_score >= 50 ? "#f59e0b" : "#ef4444" }}>
                          {Math.round(c.composite_score)}%
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>COMPOSITE</div>
                        <button onClick={() => handleRemoveCandidate(c.username)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)",
                            cursor: "pointer", fontSize: "0.7rem", marginTop: "var(--s1)", padding: 0 }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparison matrix */}
                <div style={{ marginTop: "var(--s5)", borderTop: "1px solid var(--border-primary)",
                  paddingTop: "var(--s4)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600,
                    letterSpacing: "0.08em", marginBottom: "var(--s3)" }}>COMPARISON MATRIX</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "var(--s2) var(--s3)",
                            color: "var(--text-muted)", fontWeight: 600 }}>Candidate</th>
                          {["Job Match","Tech Fit","Repo Quality","Open Source","Activity","Growth"].map((h) => (
                            <th key={h} style={{ textAlign: "center", padding: "var(--s2) var(--s3)",
                              color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                          <th style={{ textAlign: "center", padding: "var(--s2) var(--s3)",
                            color: "var(--text-muted)", fontWeight: 600 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedCandidates.map((c) => {
                          const bd = c.score_breakdown || {};
                          const scores = [
                            bd.job_match?.score, bd.tech_fit?.score, bd.repo_quality?.score,
                            bd.open_source?.score, bd.activity?.score, bd.growth?.score,
                          ];
                          return (
                            <tr key={c.id} style={{ borderTop: "1px solid var(--border-primary)" }}>
                              <td style={{ padding: "var(--s2) var(--s3)", fontWeight: 600,
                                color: "var(--text-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
                                  <RankBadge rank={c.rank_position} />
                                  {c.username}
                                </div>
                              </td>
                              {scores.map((s, i) => (
                                <td key={i} style={{ textAlign: "center", padding: "var(--s2) var(--s3)" }}>
                                  <span style={{
                                    fontWeight: 700,
                                    color: s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444",
                                  }}>
                                    {s != null ? `${Math.round(s)}%` : "—"}
                                  </span>
                                </td>
                              ))}
                              <td style={{ textAlign: "center", padding: "var(--s2) var(--s3)",
                                fontWeight: 800, color: "var(--text-primary)", fontSize: "0.875rem" }}>
                                {Math.round(c.composite_score)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Unranked candidates (not yet scored) */}
            {unrankedCandidates.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Candidates (Not Yet Ranked)</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Run ranking to score
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                  {unrankedCandidates.map((c) => {
                    const statusMeta = ANALYSIS_STATUS[c.analysis_status] || ANALYSIS_STATUS.pending;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "var(--s3)",
                        padding: "var(--s3)", borderRadius: "var(--radius-md)",
                        background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%",
                          background: statusMeta.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 600, color: "var(--text-primary)",
                          fontSize: "0.875rem" }}>{c.username}</span>
                        <span style={{ fontSize: "0.7rem", color: statusMeta.color, fontWeight: 600,
                          textTransform: "capitalize" }}>{c.analysis_status}</span>
                        <button onClick={() => handleRemoveCandidate(c.username)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)",
                            cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: "var(--s4)" }}>
                  <button onClick={handleRank} disabled={loadingRank}
                    className="btn btn-primary" style={{ width: "100%" }}>
                    {loadingRank ? "Ranking in progress…" : `⚡ Rank ${activeCampaign.candidates?.length || 0} Candidates`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
