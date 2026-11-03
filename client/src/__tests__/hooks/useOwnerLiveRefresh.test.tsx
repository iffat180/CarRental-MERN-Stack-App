import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../context/AppContext", () => ({
  useAppContext: () => ({ token: "t", isOwner: true }),
}));
vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn() }) }));
vi.mock("axios", () => ({ default: { defaults: { baseURL: "https://api.example.com" } } }));

import toast from "react-hot-toast";
import { toSocketUrl, useOwnerLiveRefresh } from "../../hooks/useOwnerLiveRefresh";

class FakeSocket {
  static instances: FakeSocket[] = [];
  sent: string[] = [];
  onopen?: () => void;
  onmessage?: (m: { data: string }) => void;
  onclose?: (e: { code: number }) => void;
  onerror?: () => void;
  closed = false;
  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.closed = true;
    this.onclose?.({ code: 1000 });
  }
  receive(msg: object) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe("toSocketUrl", () => {
  it("turns an https API into wss://host/ws", () => {
    expect(toSocketUrl("https://api.example.com/v1?x=1", "https://site.example")).toBe(
      "wss://api.example.com/ws"
    );
  });
  it("turns http into ws and keeps the port", () => {
    expect(toSocketUrl("http://localhost:3000", "http://localhost:5173")).toBe(
      "ws://localhost:3000/ws"
    );
  });
  it("falls back to the page origin when there is no base URL", () => {
    expect(toSocketUrl(undefined, "https://site.example")).toBe("wss://site.example/ws");
  });
});

describe("useOwnerLiveRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("authenticates with the login token as its first message", () => {
    renderHook(() => useOwnerLiveRefresh(vi.fn()));
    const ws = FakeSocket.instances[0];
    expect(ws.url).toBe("wss://api.example.com/ws");
    act(() => ws.onopen?.());
    expect(JSON.parse(ws.sent[0])).toEqual({ type: "auth", token: "t" });
  });

  it("refreshes and toasts when a booking arrives, and reports connected", () => {
    const refresh = vi.fn();
    const { result } = renderHook(() => useOwnerLiveRefresh(refresh));
    const ws = FakeSocket.instances[0];

    act(() => ws.receive({ type: "ready" }));
    expect(result.current).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1); // catch-up refresh

    act(() => ws.receive({ type: "booking.created", bookingId: "b1" }));
    expect(toast.success).toHaveBeenCalledWith("New booking received");
    expect(refresh).toHaveBeenCalledTimes(2);

    act(() => ws.receive({ type: "booking.cancelled", bookingId: "b1" }));
    expect(toast).toHaveBeenCalledWith("A booking was cancelled");
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("does not poll while the socket is connected", () => {
    const refresh = vi.fn();
    renderHook(() => useOwnerLiveRefresh(refresh));
    act(() => FakeSocket.instances[0].receive({ type: "ready" }));
    refresh.mockClear();

    act(() => vi.advanceTimersByTime(90_000));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("polls every 30 seconds when there is no connection", () => {
    const refresh = vi.fn();
    renderHook(() => useOwnerLiveRefresh(refresh));

    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(30_000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("stops reconnecting after 3 failed first attempts, leaving polling in charge", () => {
    renderHook(() => useOwnerLiveRefresh(vi.fn()));
    for (let i = 0; i < 6; i++) {
      const last = FakeSocket.instances[FakeSocket.instances.length - 1];
      act(() => last.onclose?.({ code: 1006 }));
      act(() => vi.advanceTimersByTime(9000));
    }
    expect(FakeSocket.instances.length).toBe(3);
  });

  it("does not retry when the server says the user is not an owner", () => {
    renderHook(() => useOwnerLiveRefresh(vi.fn()));
    act(() => FakeSocket.instances[0].onclose?.({ code: 4403 }));
    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeSocket.instances.length).toBe(1);
  });

  it("closes the socket when the page unmounts", () => {
    const { unmount } = renderHook(() => useOwnerLiveRefresh(vi.fn()));
    const ws = FakeSocket.instances[0];
    unmount();
    expect(ws.closed).toBe(true);
  });
});
