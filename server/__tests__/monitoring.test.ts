import { describe, it, expect, jest, afterEach } from "@jest/globals";
import express from "express";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";
import { initMonitoring, reportError, setErrorReporter, flushMonitoring } from "../monitoring.js";

const makeApp = (error: Error & { statusCode?: number }) => {
  const app = express();
  app.get("/boom", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
};

describe("error monitoring", () => {
  let restore: (() => void) | undefined;
  afterEach(() => restore?.());

  it("reports unexpected (500) errors with the request that caused them", async () => {
    const reporter = jest.fn();
    restore = setErrorReporter(reporter);
    jest.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("database exploded");

    const res = await request(makeApp(boom)).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/internal server error/i);
    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(boom, { method: "GET", url: "/boom" });
  });

  it("does not report errors that are the client's fault", async () => {
    const reporter = jest.fn();
    restore = setErrorReporter(reporter);
    jest.spyOn(console, "error").mockImplementation(() => {});
    const bad = Object.assign(new Error("Validation failed"), { name: "ValidationError" });
    const missing = Object.assign(new Error("Not here"), { statusCode: 404 });

    expect((await request(makeApp(bad)).get("/boom")).status).toBe(400);
    expect((await request(makeApp(missing)).get("/boom")).status).toBe(404);
    expect(reporter).not.toHaveBeenCalled();
  });

  it("never sends the internal error text to the client", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(makeApp(new Error("secret connection string"))).get("/boom");
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });

  it("stays off, and loads nothing, without a DSN", async () => {
    expect(await initMonitoring(undefined)).toBe(false);
    expect(await initMonitoring("")).toBe(false);
    expect(() => reportError(new Error("ignored"))).not.toThrow();
    await expect(flushMonitoring()).resolves.toBeUndefined();
  });
});
