import type { Server } from "node:http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import User from "./models/User.js";

/**
 * Live updates for owners (new bookings, cancellations) over a WebSocket at /ws.
 *
 * Protocol:
 *   1. the browser connects to /ws
 *   2. its first message must be { "type": "auth", "token": "<login JWT>" }
 *      (the token is sent as a message, not in the URL, so it never lands in logs)
 *   3. only owners are accepted; the server answers { "type": "ready" }
 *   4. whenever one of that owner's bookings changes the server pushes an event
 *
 * This needs a long-running server (server.ts). A serverless host such as Vercel
 * cannot hold a WebSocket open, so there nothing registers and notifyOwner() is a
 * harmless no-op; the web app falls back to polling.
 */

export interface RealtimeEvent {
  type: "booking.created" | "booking.updated" | "booking.cancelled";
  bookingId: string;
}

/** Checks a login token and returns who it belongs to, or null if it is not valid. */
export type Authenticate = (token: string) => Promise<{ id: string; role: string } | null>;

export const authenticateToken: Authenticate = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as string | JwtPayload;
    const userId = typeof decoded === "string" ? decoded : (decoded.userId as string | undefined);
    if (!userId) return null;
    const user = await User.findById(userId).select("role");
    return user ? { id: String(user._id), role: user.role } : null;
  } catch {
    return null;
  }
};

/**
 * Same rule as the CORS config: in production only the origins listed in
 * ALLOWED_ORIGINS may open a socket; elsewhere anything goes when the list is empty.
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const production = process.env.NODE_ENV === "production";
  if (allowed.length === 0) return !production;
  if (!origin) return !production;
  return allowed.includes(origin);
};

// owner id -> that owner's open sockets (an owner can have several tabs open)
const sockets = new Map<string, Set<WebSocket>>();

/** Pushes an event to every open socket of this owner. Returns how many received it. */
export const notifyOwner = (ownerId: unknown, event: RealtimeEvent): number => {
  const open = sockets.get(String(ownerId));
  if (!open) return 0;
  const message = JSON.stringify(event);
  let sent = 0;
  for (const ws of open) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent++;
    }
  }
  return sent;
};

interface RealtimeOptions {
  /** how long a new connection has to send its auth message */
  authTimeoutMs?: number;
  /** how often to ping clients and drop the ones that stopped answering */
  heartbeatMs?: number;
}

export const attachRealtime = (
  server: Server,
  authenticate: Authenticate = authenticateToken,
  { authTimeoutMs = 5000, heartbeatMs = 30000 }: RealtimeOptions = {}
): WebSocketServer => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 4096,
    verifyClient: ({ origin }, done) =>
      isOriginAllowed(origin) ? done(true) : done(false, 403, "Origin not allowed"),
  });
  const alive = new WeakMap<WebSocket, boolean>();

  wss.on("connection", (ws) => {
    let ownerId: string | null = null;
    alive.set(ws, true);
    ws.on("pong", () => alive.set(ws, true));

    const authTimer = setTimeout(() => ws.close(4401, "auth timeout"), authTimeoutMs);

    ws.on("message", async (raw) => {
      if (ownerId) return; // already authenticated, nothing else to say
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type !== "auth" || typeof msg.token !== "string") throw new Error("bad message");
        const who = await authenticate(msg.token);
        if (!who || who.role !== "owner") {
          ws.close(4403, "forbidden");
          return;
        }
        clearTimeout(authTimer);
        ownerId = who.id;
        if (!sockets.has(ownerId)) sockets.set(ownerId, new Set());
        sockets.get(ownerId)!.add(ws);
        ws.send(JSON.stringify({ type: "ready" }));
      } catch {
        ws.close(4400, "bad auth message");
      }
    });

    ws.on("close", () => {
      clearTimeout(authTimer);
      if (!ownerId) return;
      const set = sockets.get(ownerId);
      set?.delete(ws);
      if (set && set.size === 0) sockets.delete(ownerId);
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (alive.get(ws) === false) {
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      ws.ping();
    }
  }, heartbeatMs);
  heartbeat.unref();
  wss.on("close", () => clearInterval(heartbeat));

  return wss;
};
