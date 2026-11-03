import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../../components/ErrorBoundary";

vi.mock("../../lib/monitoring", () => ({ reportError: vi.fn() }));
import { reportError } from "../../lib/monitoring";

const Broken = () => {
  throw new Error("render failed");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
    // React logs caught render errors; keep the test output readable
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows its children when nothing is wrong", () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("all good")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("replaces a crashing page with a message and options to recover", () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload the page" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to the home page" }).getAttribute("href")).toBe(
      "/"
    );
  });

  it("reports the error with the component stack", () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(reportError).toHaveBeenCalledTimes(1);
    const [error, context] = vi.mocked(reportError).mock.calls[0];
    expect((error as Error).message).toBe("render failed");
    expect(context).toHaveProperty("componentStack");
  });

  it("recovers when it is given a new key (the page changed)", () => {
    const { rerender } = render(
      <ErrorBoundary key="a">
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeTruthy();

    rerender(
      <ErrorBoundary key="b">
        <p>another page</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("another page")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
