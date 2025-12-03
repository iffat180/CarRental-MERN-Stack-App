import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";
import corsConfig from "./configs/cors.js";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import recommendationRouter from "./routes/recommendation.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ============================================
// Environment Variable Validation
// ============================================

const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};

const validateEnvVars = () => {
  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set the following environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
};

validateEnvVars();

// Initialize Express App
const app = express()

// Connect to Database
await connectDB();

// ============================================
// Middleware Configuration
// ============================================

// CORS Configuration
app.use(corsConfig);

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Body Parser
app.use(express.json());

// Static File Serving
app.use("/uploads", express.static("uploads"));


// ============================================
// Routes
// ============================================

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Car Rental API Server',
    version: '1.0.0',
    health: '/health'
  });
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/bookings', bookingRouter);
// AI-powered car recommendations endpoint
app.use('/api', recommendationRouter);

// ============================================
// Error Handling
// ============================================

// 404 Handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global Error Handler - must be last middleware
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

const PORT = process.env.PORT || 3000;

// Declare server variable (will be assigned after app.listen)
let server;

// ============================================
// Process Handlers
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Close server gracefully if it exists
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed due to unhandled rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connection
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });
    });
  } else {
    // If server not started yet, just close DB
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  }
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers (override db.js handlers to include HTTP server)
process.removeAllListeners('SIGINT');
process.removeAllListeners('SIGTERM');
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server and store instance
server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
