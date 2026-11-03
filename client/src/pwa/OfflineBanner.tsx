import React from "react";
import { useOnlineStatus } from "./useOnlineStatus";

/** A thin bar across the top while the device is offline, so a missing page or a failed action makes sense. */
const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        padding: "8px 16px",
        textAlign: "center",
        fontSize: 14,
        color: "#fff",
        background: "var(--color-ink)",
      }}
    >
      You&apos;re offline. You can browse the cars you saw last, but booking needs a connection.
    </div>
  );
};

export default OfflineBanner;
