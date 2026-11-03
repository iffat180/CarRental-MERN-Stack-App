import type { Server } from "node:http";
import type { WebSocketServer } from "ws";
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./configs/db.js";
import { attachRealtime } from "./realtime.js";

// Long-running entry point (local dev and Render). The Vercel serverless
// entry point is api/index.ts; both share the app defined in app.ts.

// ============================================
// Environment Variable Validation
// ============================================

const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};

const missing = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:", missing.join(", "));
  missing.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
}
console.log("✅ Environment variables validated");

// Connect to Database
await connectDB();

// ============================================
// Server Startup
// ============================================

const PORT = process.env.PORT || 3000;

// Assigned after app.listen
let server: Server | undefined;
let realtime: WebSocketServer | undefined;

// ============================================
// Process Handlers
// ============================================

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: unknown) => {
  console.error("❌ Unhandled Promise Rejection:", {
    message: err instanceof Error ? err.message : String(err),
    name: err instanceof Error ? err.name : "Error",
    stack: process.env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Close server gracefully if it exists
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed due to unhandled rejection");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Open WebSockets would keep server.close() waiting forever, so drop them first
  realtime?.clients.forEach((client) => client.terminate());

  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");

      // Close database connection
      void mongoose.connection.close().then(() => {
        console.log("✅ MongoDB connection closed");
        console.log("✅ Graceful shutdown complete");
        process.exit(0);
      });
    });
  } else {
    // If server not started yet, just close DB
    void mongoose.connection.close().then(() => {
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    });
  }

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers (override db.js handlers to include HTTP server)
process.removeAllListeners("SIGINT");
process.removeAllListeners("SIGTERM");
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start server and store instance
server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Live booking updates for owners (WebSocket at /ws)
realtime = attachRealtime(server);
