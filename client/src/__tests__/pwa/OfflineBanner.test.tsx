import { describe, it, expect, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import OfflineBanner from "../../pwa/OfflineBanner";

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
  window.dispatchEvent(new Event(online ? "online" : "offline"));
};

describe("OfflineBanner", () => {
  afterEach(() => setOnline(true));

  it("is hidden while online", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("appears when the connection drops and disappears when it returns", () => {
    render(<OfflineBanner />);

    act(() => setOnline(false));
    expect(screen.getByRole("status")).toHaveTextContent("You're offline");

    act(() => setOnline(true));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is shown straight away if the page opens offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
