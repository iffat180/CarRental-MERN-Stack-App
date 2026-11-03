import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import type { RealtimeEvent } from "../types";

/** ws(s)://<api host>/ws, built from the same base URL axios uses. */
export const toSocketUrl = (baseUrl: string | undefined, pageOrigin: string): string => {
  const url = new URL(baseUrl || pageOrigin, pageOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  return url.toString();
};

/** Close code the server uses for "not an owner": retrying would never help. */
const FORBIDDEN = 4403;
/** Give up after this many failed attempts when we never managed to connect. */
const MAX_FIRST_ATTEMPTS = 3;
const POLL_MS = 30_000;

/**
 * Keeps an owner's page up to date.
 *
 *  - If the server supports it, a WebSocket pushes booking events and `refresh`
 *    runs right away (with a toast for new and cancelled bookings).
 *  - If the socket cannot connect (for example on a serverless host, which cannot
 *    hold one open), the page quietly polls every 30 seconds instead.
 *
 * `refresh` should update the data without showing a loading spinner.
 */
export const useOwnerLiveRefresh = (refresh: () => void | Promise<void>): boolean => {
  const { token, isOwner } = useAppContext();
  const [connected, setConnected] = useState(false);

  // always call the latest refresh without reconnecting every render
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!isOwner || !token) return;

    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let attempts = 0;
    let everConnected = false;

    const connect = () => {
      socket = new WebSocket(toSocketUrl(axios.defaults.baseURL, window.location.origin));

      socket.onopen = () => socket?.send(JSON.stringify({ type: "auth", token }));

      socket.onmessage = (message) => {
        let event: { type?: string };
        try {
          event = JSON.parse(message.data);
        } catch {
          return;
        }
        if (event.type === "ready") {
          everConnected = true;
          attempts = 0;
          setConnected(true);
          refreshRef.current(); // catch up on anything missed while offline
        } else if (event.type?.startsWith("booking.")) {
          const { type } = event as RealtimeEvent;
          if (type === "booking.created") toast.success("New booking received");
          if (type === "booking.cancelled") toast("A booking was cancelled");
          refreshRef.current();
        }
      };

      socket.onclose = (event) => {
        setConnected(false);
        if (stopped || event.code === FORBIDDEN) return;
        attempts++;
        if (!everConnected && attempts >= MAX_FIRST_ATTEMPTS) return; // polling takes over
        timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts));
      };

      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
      setConnected(false);
    };
  }, [isOwner, token]);

  // fallback: poll while there is no live connection
  useEffect(() => {
    if (connected || !isOwner) return;
    const id = setInterval(() => refreshRef.current(), POLL_MS);
    return () => clearInterval(id);
  }, [connected, isOwner]);

  return connected;
};
