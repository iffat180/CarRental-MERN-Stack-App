import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PwaPrompt from "../../pwa/PwaPrompt";
import { pwaState } from "../../test/pwaRegisterStub";

vi.mock("../../lib/monitoring", () => ({ reportError: vi.fn() }));

describe("PwaPrompt", () => {
  beforeEach(() => {
    pwaState.needRefresh = false;
    pwaState.offlineReady = false;
    pwaState.setNeedRefresh = vi.fn();
    pwaState.setOfflineReady = vi.fn();
    pwaState.updateServiceWorker = vi.fn();
  });

  it("shows nothing when there is nothing to say", () => {
    const { container } = render(<PwaPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("offers a reload when a new version is ready, and applies it only when asked", async () => {
    pwaState.needRefresh = true;
    render(<PwaPrompt />);
    expect(screen.getByRole("status")).toHaveTextContent("A new version of Wayfarer is ready.");
    expect(pwaState.updateServiceWorker).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(pwaState.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("lets the visitor put the update off", async () => {
    pwaState.needRefresh = true;
    render(<PwaPrompt />);
    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(pwaState.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(pwaState.updateServiceWorker).not.toHaveBeenCalled();
  });

  it("says when the site is ready to work offline", () => {
    pwaState.offlineReady = true;
    render(<PwaPrompt />);
    expect(screen.getByRole("status")).toHaveTextContent("ready to work offline");
  });

  it("prefers the update message when both apply", () => {
    pwaState.needRefresh = true;
    pwaState.offlineReady = true;
    render(<PwaPrompt />);
    expect(screen.getByRole("status")).toHaveTextContent("new version");
  });
});
