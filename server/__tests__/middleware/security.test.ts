import { describe, it, expect } from "@jest/globals";
import express from "express";
import request from "supertest";
import app from "../../app.js";
import { sanitizeBody } from "../../middleware/sanitizeBody.js";

describe("security headers (helmet)", () => {
  it("sets the standard protective headers on every response", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["strict-transport-security"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("does not advertise the framework", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("allows other origins to load resources (the web app is on a different origin)", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});

describe("sanitizeBody (NoSQL injection guard)", () => {
  const echo = express();
  echo.use(express.json());
  echo.use(sanitizeBody);
  echo.post("/echo", (req, res) => res.json(req.body));

  it("removes Mongo operator keys from a JSON body", async () => {
    const res = await request(echo)
      .post("/echo")
      .send({ email: { $ne: null }, password: "x", nested: { deep: { $gt: "" } } });

    expect(res.status).toBe(200);
    expect(res.body.email).toEqual({});
    expect(res.body.nested.deep).toEqual({});
    expect(res.body.password).toBe("x");
  });

  it("leaves normal bodies untouched", async () => {
    const body = { email: "a@b.com", password: "secret", tags: ["a", "b"], n: 3 };
    const res = await request(echo).post("/echo").send(body);
    expect(res.body).toEqual(body);
  });

  it("does not crash on requests without a body", async () => {
    const res = await request(echo).post("/echo");
    expect(res.status).toBe(200);
  });
});
