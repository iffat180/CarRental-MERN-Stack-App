import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const post = vi.fn();
vi.mock("../../context/AppContext", () => ({
  useAppContext: () => ({ axios: { post }, cars: [] }),
}));

import { friendlyError, useAssistantChat } from "../../assistant/useAssistantChat";

const reply = (text: string, cars: unknown[] = []) => ({
  data: { success: true, reply: text, cars },
});

describe("useAssistantChat", () => {
  beforeEach(() => {
    post.mockReset();
    sessionStorage.clear();
  });

  it("sends the question, then adds the assistant's reply and its cars", async () => {
    const car = { id: "abc", name: "2023 Subaru Outback", city: "Denver", price_per_day_usd: 95 };
    post.mockResolvedValue(reply("Try the Outback.", [car]));
    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.send("a car for skis");
    });

    expect(post).toHaveBeenCalledWith("/api/assistant", {
      messages: [{ role: "user", content: "a car for skis" }],
    });
    expect(result.current.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "a car for skis"],
      ["assistant", "Try the Outback."],
    ]);
    expect(result.current.messages[1].cars).toEqual([car]);
    expect(result.current.loading).toBe(false);
  });

  it("is loading while it waits, and ignores a second message until the first is answered", async () => {
    let finish!: (v: unknown) => void;
    post.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useAssistantChat());

    act(() => {
      void result.current.send("first");
    });
    await waitFor(() => expect(result.current.loading).toBe(true));
    await act(async () => {
      await result.current.send("second, too soon");
    });
    expect(post).toHaveBeenCalledTimes(1);

    await act(async () => finish(reply("done")));
    expect(result.current.loading).toBe(false);
  });

  it("ignores blank messages and trims the text", async () => {
    post.mockResolvedValue(reply("ok"));
    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.send("   ");
    });
    expect(post).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.send("  hello  ");
    });
    expect(post.mock.calls[0][1].messages[0].content).toBe("hello");
  });

  it("sends only the recent turns and never its own error bubbles", async () => {
    post.mockRejectedValueOnce({ response: { status: 503 } });
    post.mockResolvedValue(reply("ok"));
    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.send("one");
    });
    expect(result.current.messages[1].error).toBe(true);

    for (let i = 2; i <= 9; i++) {
      await act(async () => {
        await result.current.send(`question ${i}`);
      });
    }
    const sent = post.mock.calls[post.mock.calls.length - 1][1].messages;
    expect(sent.length).toBeLessThanOrEqual(12);
    expect(sent.every((m: { role: string }) => m.role === "user" || m.role === "assistant")).toBe(
      true
    );
    expect(sent.some((m: { content: string }) => /isn't available/.test(m.content))).toBe(false);
  });

  it("shows a friendly error bubble when the call fails", async () => {
    post.mockRejectedValue({ response: { status: 429 } });
    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.send("hi");
    });

    const last = result.current.messages[1];
    expect(last.error).toBe(true);
    expect(last.content).toMatch(/wait a minute/);
    expect(result.current.loading).toBe(false);
  });

  it("keeps the conversation in this tab across a refresh, and clears it on request", async () => {
    post.mockResolvedValue(reply("hello there"));
    const first = renderHook(() => useAssistantChat());
    await act(async () => {
      await first.result.current.send("hi");
    });
    first.unmount();

    const second = renderHook(() => useAssistantChat()); // like a page reload
    expect(second.result.current.messages.map((m) => m.content)).toEqual(["hi", "hello there"]);

    act(() => second.result.current.clear());
    expect(second.result.current.messages).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem("wayfarer-assistant-chat")!)).toEqual([]);
  });

  it("starts empty if the saved chat is damaged", () => {
    sessionStorage.setItem("wayfarer-assistant-chat", "{not json");
    const { result } = renderHook(() => useAssistantChat());
    expect(result.current.messages).toEqual([]);
  });
});

describe("friendlyError", () => {
  it("has a plain message for each failure", () => {
    expect(friendlyError({ response: { status: 429 } })).toMatch(/quickly/);
    expect(friendlyError({ response: { status: 503 } })).toMatch(/isn't available/);
    expect(friendlyError({ response: { status: 502 } })).toMatch(/isn't available/);
    expect(friendlyError({ response: { status: 400 } })).toMatch(/shortening/);
    expect(friendlyError({ message: "Network Error" })).toMatch(/couldn't reach/);
    expect(friendlyError({ response: { status: 500 } })).toMatch(/Something went wrong/);
  });
});
