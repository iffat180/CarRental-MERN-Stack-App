import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocket, type WebSocketServer } from "ws";
import { attachRealtime, isOriginAllowed, notifyOwner, type Authenticate } from "../realtime.js";

// The login check is injected, so these tests need no database or JWT secret.
const authenticate: Authenticate = async (token) => {
  if (token === "owner-1") return { id: "owner-1", role: "owner" };
  if (token === "owner-2") return { id: "owner-2", role: "owner" };
  if (token === "customer") return { id: "c-1", role: "user" };
  return null;
};

let server: Server;
let wss: WebSocketServer;
let port: number;

beforeAll(async () => {
  server = createServer();
  wss = attachRealtime(server, authenticate, { authTimeoutMs: 200, heartbeatMs: 60_000 });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  wss.clients.forEach((c) => c.terminate());
  await new Promise<void>((resolve) => wss.close(() => resolve()));
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const connect = () => new WebSocket(`ws://localhost:${port}/ws`);
const nextMessage = (ws: WebSocket) =>
  new Promise<any>((resolve) => ws.once("message", (data) => resolve(JSON.parse(data.toString()))));
const closed = (ws: WebSocket) =>
  new Promise<number>((resolve) => ws.once("close", (code) => resolve(code)));
const opened = (ws: WebSocket) => new Promise<void>((resolve) => ws.once("open", () => resolve()));

const login = async (token: string) => {
  const ws = connect();
  await opened(ws);
  const ready = nextMessage(ws);
  ws.send(JSON.stringify({ type: "auth", token }));
  expect(await ready).toEqual({ type: "ready" });
  return ws;
};

describe("realtime owner updates", () => {
  it("delivers an event to the owner it is meant for", async () => {
    const ws = await login("owner-1");
    const got = nextMessage(ws);

    expect(notifyOwner("owner-1", { type: "booking.created", bookingId: "b1" })).toBe(1);
    expect(await got).toEqual({ type: "booking.created", bookingId: "b1" });
    ws.close();
  });

  it("does not deliver it to another owner", async () => {
    const one = await login("owner-1");
    const two = await login("owner-2");
    let twoGot = false;
    two.on("message", () => (twoGot = true));
    const got = nextMessage(one);

    notifyOwner("owner-1", { type: "booking.cancelled", bookingId: "b2" });
    await got;
    await new Promise((r) => setTimeout(r, 50));

    expect(twoGot).toBe(false);
    one.close();
    two.close();
  });

  it("sends to every open tab of the same owner", async () => {
    const a = await login("owner-1");
    const b = await login("owner-1");
    const gotA = nextMessage(a);
    const gotB = nextMessage(b);

    expect(notifyOwner("owner-1", { type: "booking.updated", bookingId: "b3" })).toBe(2);
    expect((await gotA).bookingId).toBe("b3");
    expect((await gotB).bookingId).toBe("b3");
    a.close();
    b.close();
  });

  it("refuses a customer account (close code 4403)", async () => {
    const ws = connect();
    await opened(ws);
    const code = closed(ws);
    ws.send(JSON.stringify({ type: "auth", token: "customer" }));
    expect(await code).toBe(4403);
  });

  it("refuses an invalid token (close code 4403)", async () => {
    const ws = connect();
    await opened(ws);
    const code = closed(ws);
    ws.send(JSON.stringify({ type: "auth", token: "nope" }));
    expect(await code).toBe(4403);
  });

  it("refuses a first message that is not an auth message (4400)", async () => {
    const ws = connect();
    await opened(ws);
    const code = closed(ws);
    ws.send("hello");
    expect(await code).toBe(4400);
  });

  it("closes a connection that never authenticates (4401)", async () => {
    const ws = connect();
    await opened(ws);
    expect(await closed(ws)).toBe(4401);
  });

  it("stops delivering after the owner disconnects", async () => {
    const ws = await login("owner-2");
    const code = closed(ws);
    ws.close();
    await code;
    await new Promise((r) => setTimeout(r, 30));

    expect(notifyOwner("owner-2", { type: "booking.created", bookingId: "b4" })).toBe(0);
  });

  it("is a no-op when nobody is connected", () => {
    expect(notifyOwner("nobody", { type: "booking.created", bookingId: "b5" })).toBe(0);
  });
});

describe("isOriginAllowed", () => {
  const original = { ...process.env };
  const set = (env: Record<string, string | undefined>) => {
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  afterAll(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    if (original.ALLOWED_ORIGINS === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = original.ALLOWED_ORIGINS;
  });

  it("allows only listed origins in production", () => {
    set({ NODE_ENV: "production", ALLOWED_ORIGINS: "https://a.example, https://b.example" });
    expect(isOriginAllowed("https://a.example")).toBe(true);
    expect(isOriginAllowed("https://evil.example")).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(false);
  });

  it("refuses everything in production when no origins are configured", () => {
    set({ NODE_ENV: "production", ALLOWED_ORIGINS: undefined });
    expect(isOriginAllowed("https://a.example")).toBe(false);
  });

  it("is open in development when no origins are configured", () => {
    set({ NODE_ENV: "development", ALLOWED_ORIGINS: undefined });
    expect(isOriginAllowed("http://localhost:5173")).toBe(true);
    expect(isOriginAllowed(undefined)).toBe(true);
  });
});
