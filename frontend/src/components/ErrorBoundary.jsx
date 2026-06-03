/**
 * ErrorBoundary.jsx — Global React Error Boundary
 *
 * WHY THIS EXISTS:
 * Without an error boundary, any uncaught JavaScript error in a React component
 * will crash the entire app and show a blank white page in production.
 * This component catches those errors and shows a graceful recovery screen instead.
 *
 * Must be a class component — React does not support error boundaries as function components.
 * React 19 does not yet expose an official hook equivalent (useErrorBoundary) for full tree catches.
 */

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger the fallback UI on the next render
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console — replace with a real error tracking service (Sentry, etc.) in production
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Navigate to dashboard as a safe fallback
    window.location.href = "/dashboard";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary, #0a0a0f)",
          color: "var(--text-primary, #e2e8f0)",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            color: "var(--text-primary, #e2e8f0)",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.95rem",
            maxWidth: "480px",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. The error has been logged. Click below to
          return to the dashboard.
        </p>

        {/* Show error message in dev only */}
        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "1rem",
              fontSize: "0.75rem",
              color: "#fca5a5",
              maxWidth: "600px",
              textAlign: "left",
              overflowX: "auto",
              marginBottom: "2rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.toString()}
          </pre>
        )}

        <button
          onClick={this.handleReset}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
