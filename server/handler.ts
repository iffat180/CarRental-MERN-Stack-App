import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";
import app from "./app.js";
import { errMessage } from "./utils/errors.js";

// Serverless request handler. It is compiled by `npm run build` into
// dist/handler.js, and api/index.js (plain JavaScript) re-exports it, so
// Vercel never has to compile TypeScript itself.
// A function instance can serve many requests while it stays warm, so the
// database connection is created once and reused instead of reconnecting on
// every request.
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
