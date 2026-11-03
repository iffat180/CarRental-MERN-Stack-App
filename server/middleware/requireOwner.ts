import type { RequestHandler } from "express";

export const requireOwner: RequestHandler = (req, res, next) => {
  // Check if user exists (should be set by protect middleware)
  if (!req.user) {
    res.status(403).json({ success: false, message: "Authentication required" });
    return;
  }

  // Check if user is owner
  if (req.user.role !== "owner") {
    res.status(403).json({
      success: false,
      message: "Access denied. Owner role required.",
    });
    return;
  }

  // User is owner, proceed
  next();
};
