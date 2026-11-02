// Vercel compiles from this entry file only, so it never reads tsconfig's
// "include" list. These pull in the ambient types (req.user, process.env).
/// <reference path="../types/env.d.ts" />
/// <reference path="../types/express.d.ts" />
import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";
import app from "../app.js";
import { errMessage } from "../utils/errors.js";

// Vercel serverless entry point. A function instance can serve many requests
// while it stays warm, so the database connection is created once and reused
// instead of reconnecting on every request.
let connection: Promise<typeof mongoose> | undefined;

const ensureDb = (): Promise<typeof mongoose> => {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err: unknown) => {
        connection = undefined; // allow a retry on the next request
        throw err;
      });
  }
  return connection;
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      throw new Error("Missing MONGODB_URI or JWT_SECRET environment variable");
    }
    await ensureDb();
  } catch (err) {
    console.error("[api] startup failure:", errMessage(err));
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Service is not configured correctly." }));
    return;
  }
  app(req, res);
}
