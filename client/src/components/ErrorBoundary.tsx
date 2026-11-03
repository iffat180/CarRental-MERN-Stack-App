import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "../lib/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a crash while rendering a page and shows a friendly message instead of a blank
 * screen. The error is reported (see lib/monitoring). It uses plain links and buttons, not
 * the app's context or router, so it can still work when those are what broke.
 *
 * Give it a `key` that changes with the page, and it recovers on its own when the visitor
 * moves to another page.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert" className="a4-wrap" style={{ padding: "96px 24px", textAlign: "center" }}>
        <h1 className="disp" style={{ fontSize: 28, marginBottom: 12 }}>
          Something went wrong
        </h1>
        <p className="a4-muted" style={{ marginBottom: 28 }}>
          This page hit an unexpected problem. It has been reported. Reloading usually fixes it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="a4-primary"
            style={{ minHeight: 48, padding: "0 28px", borderRadius: 12 }}
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
          <a
            href="/"
            className="a4-flink"
            style={{
              minHeight: 48,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            Go to the home page
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
