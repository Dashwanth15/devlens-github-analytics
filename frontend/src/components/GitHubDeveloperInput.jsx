import { useMemo } from "react";
import { extractUsername, isValidGitHubUsername } from "../utils/github";

/**
 * GitHubDeveloperInput - Reusable developer input component with:
 * - Free text input for username, @username, or full GitHub URL
 * - Live canonical username normalization preview
 * - Format validation against official GitHub handle rules
 * - Quick-select suggestion chips from recent/saved profiles
 * - Resolved profile preview card (avatar, name, handle, badges)
 * - Error & loading state indicators
 */
export default function GitHubDeveloperInput({
  id = "github-developer-input",
  label = "GitHub Developer",
  value = "",
  onChange,
  onSelectProfile,
  recentProfiles = [],
  placeholder = "Enter GitHub username or profile URL",
  helperText = "Analyze any public GitHub profile — saved profiles are only recent suggestions.",
  loading = false,
  error = null,
  resolvedProfile = null,
  onClear,
  disabled = false,
  onKeyDown,
  required = false,
  accentColor = "var(--accent-primary, #7C3AED)",
}) {
  const normalized = useMemo(() => extractUsername(value), [value]);
  const isUrlOrAt = value && (value.includes("github.com") || value.startsWith("@") || value.includes("/"));
  const isValidFormat = !normalized || isValidGitHubUsername(normalized);

  const handleChipClick = (profile) => {
    if (onSelectProfile) {
      onSelectProfile(profile);
    } else if (onChange) {
      onChange(profile.username);
    }
  };

  return (
    <div className="github-dev-input-group" style={{ display: "flex", flexDirection: "column", gap: "var(--s2, 8px)" }}>
      {/* Label and validation status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label
          htmlFor={id}
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--text-secondary, #A1A1AA)",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "var(--s2, 8px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accentColor,
              display: "inline-block",
            }}
          />
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>

        {/* Live normalization preview tag */}
        {value.trim() && (
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "JetBrains Mono, monospace",
              color: isValidFormat ? "var(--text-muted, #71717A)" : "#EF4444",
              background: "rgba(255,255,255,0.03)",
              padding: "2px 8px",
              borderRadius: "999px",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
            }}
          >
            {!isValidFormat ? (
              "Invalid username format"
            ) : isUrlOrAt ? (
              <span>Target: <strong style={{ color: "var(--text-primary, #FAFAFA)" }}>@{normalized}</strong></span>
            ) : (
              <span>@{normalized}</span>
            )}
          </span>
        )}
      </div>

      {/* Input container */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* GitHub icon */}
        <span
          style={{
            position: "absolute",
            left: 14,
            display: "flex",
            alignItems: "center",
            color: "var(--text-muted, #71717A)",
            pointerEvents: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </span>

        <input
          id={id}
          type="text"
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || loading}
          style={{
            width: "100%",
            paddingLeft: 42,
            paddingRight: value ? 36 : 14,
            borderColor: error || (!isValidFormat && value) ? "#EF4444" : undefined,
            boxSizing: "border-box",
            height: 44,
            fontSize: "0.9rem",
          }}
        />

        {/* Clear button */}
        {value && !loading && (
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              else if (onChange) onChange("");
            }}
            title="Clear input"
            style={{
              position: "absolute",
              right: 10,
              background: "none",
              border: "none",
              color: "var(--text-muted, #71717A)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              borderRadius: "50%",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Loading spinner */}
        {loading && (
          <div
            style={{
              position: "absolute",
              right: 12,
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: accentColor,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
      </div>

      {/* Helper text or validation error */}
      {error ? (
        <div style={{ fontSize: "0.75rem", color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      ) : !isValidFormat && value ? (
        <div style={{ fontSize: "0.75rem", color: "#EF4444" }}>
          GitHub usernames must be 1-39 alphanumeric characters or single hyphens.
        </div>
      ) : helperText ? (
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #71717A)" }}>
          {helperText}
        </div>
      ) : null}

      {/* Resolved Profile Card Preview */}
      {resolvedProfile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            borderRadius: "var(--radius-md, 8px)",
            padding: "8px 12px",
            marginTop: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {resolvedProfile.avatar_url && (
              <img
                src={resolvedProfile.avatar_url}
                alt={resolvedProfile.username}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--text-primary, #FAFAFA)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {resolvedProfile.name || resolvedProfile.username}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "var(--accent-light, #A78BFA)",
                }}
              >
                @{resolvedProfile.username}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {resolvedProfile.most_used_language && (
              <span className="badge badge-gray" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                {resolvedProfile.most_used_language}
              </span>
            )}
            <span
              style={{
                fontSize: "0.7rem",
                color: "#10B981",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 600,
              }}
            >
              ✓ Ready
            </span>
          </div>
        </div>
      )}

      {/* Quick-Select Suggestions from Recent Profiles */}
      {recentProfiles && recentProfiles.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted, #71717A)",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>Recent Suggestions:</span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {recentProfiles.slice(0, 5).map((p) => {
              const uname = p.username || p;
              const isSelected = normalized === uname.toLowerCase();
              return (
                <button
                  key={uname}
                  type="button"
                  onClick={() => handleChipClick(p)}
                  disabled={disabled || loading}
                  style={{
                    background: isSelected ? "rgba(124, 58, 237, 0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isSelected ? "var(--accent-primary, #7C3AED)" : "rgba(255,255,255,0.08)"}`,
                    color: isSelected ? "var(--text-primary, #FAFAFA)" : "var(--text-secondary, #A1A1AA)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: "0.75rem",
                    fontFamily: "JetBrains Mono, monospace",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                >
                  {p.avatar_url && (
                    <img
                      src={p.avatar_url}
                      alt={uname}
                      style={{ width: 14, height: 14, borderRadius: "50%" }}
                    />
                  )}
                  <span>@{uname}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
