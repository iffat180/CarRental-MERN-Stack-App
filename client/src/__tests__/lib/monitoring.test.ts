import { describe, it, expect, vi, afterEach } from "vitest";

describe("monitoring without a DSN", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is off, and reportError only logs to the console", async () => {
    const { monitoringEnabled, initMonitoring, reportError } = await import("../../lib/monitoring");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(monitoringEnabled).toBe(false);
    expect(() => initMonitoring()).not.toThrow();

    const error = new Error("nothing to report to");
    expect(() => reportError(error, { page: "/cars" })).not.toThrow();
    expect(log).toHaveBeenCalledWith(error);
  });
});
