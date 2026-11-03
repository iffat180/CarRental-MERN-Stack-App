import express from "express";
import helmet from "helmet";
import corsConfig from "./configs/cors.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import recommendationRouter from "./routes/recommendation.js";
import { createAssistantRouter } from "./routes/assistant.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitizeBody.js";

// The Express app, with no side effects: it does not listen on a port, connect
// to the database, or register process handlers. That lets two entry points
// share it:
//   - server.ts    long-running server (local dev, Render)
//   - api/index.ts serverless function (Vercel)
const app = express();

// Behind a proxy (Render, Vercel) the client IP arrives in X-Forwarded-For.
// Trusting one hop lets express-rate-limit key on the real client.
app.set("trust proxy", 1);

// ============================================
// Middleware
// ============================================

// Security headers (X-Content-Type-Options, HSTS, frame protection, a strict
// Content-Security-Policy for the API's own responses, no X-Powered-By).
// The browser app lives on another origin and reads our images with <img>,
// so resources must be loadable cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(corsConfig);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Remove Mongo operator keys from JSON bodies (NoSQL injection guard)
app.use(sanitizeBody);

app.use("/uploads", express.static("uploads"));

// ============================================
// Routes
// ============================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Car Rental API Server",
    version: "1.0.0",
    health: "/health",
  });
});

app.use("/api/user", userRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/bookings", bookingRouter);
// AI-powered car recommendations endpoint
app.use("/api", recommendationRouter);
// Chat assistant (read-only car tools)
app.use("/api", createAssistantRouter());

// ============================================
// Error handling
// ============================================

// 404 handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler - must be last
app.use(errorHandler);

export default app;
