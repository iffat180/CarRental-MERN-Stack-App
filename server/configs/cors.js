import cors from "cors";

const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Get allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
      : [];

    // In production, require origin to be in whitelist
    if (process.env.NODE_ENV === "production") {
      if (!origin || allowedOrigins.length === 0) {
        return callback(new Error("CORS: No allowed origins configured for production"));
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    }

    // In development, allow all origins if ALLOWED_ORIGINS is not set
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // In development, check whitelist if provided
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
});

export default corsConfig;

