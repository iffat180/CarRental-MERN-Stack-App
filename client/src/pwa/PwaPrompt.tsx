import React, { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { reportError } from "../lib/monitoring";

const bar: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 20,
  transform: "translateX(-50%)",
  zIndex: 70,
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "center",
  maxWidth: "calc(100vw - 32px)",
  padding: "12px 16px",
  borderRadius: 16,
  color: "#fff",
  background: "var(--color-ink)",
  boxShadow: "0 12px 32px rgba(20, 24, 28, 0.3)",
  fontSize: 15,
};

const button: React.CSSProperties = {
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 12,
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "transparent",
  color: "#fff",
};

/**
 * Registers the service worker and tells the visitor about two things:
 *  - the first time the site is ready to work offline
 *  - a new version, with a Reload button (it is never applied behind their back)
 */
const PwaPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error: unknown) => reportError(error, { where: "service worker" }),
  });

  // "ready offline" is good news, not a question: let it go by itself
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (needRefresh) {
    return (
      <div role="status" style={bar}>
        <span>A new version of Wayfarer is ready.</span>
        <button
          type="button"
          style={{ ...button, background: "#fff", color: "var(--color-ink)" }}
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
        <button type="button" style={button} onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div role="status" style={bar}>
        <span>Wayfarer is ready to work offline.</span>
      </div>
    );
  }

  return null;
};

export default PwaPrompt;
