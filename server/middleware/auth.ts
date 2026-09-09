import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import User from "../models/User.js";
import { errName } from "../utils/errors.js";

export const protect: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to access this resource.",
    });
    return;
  }

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Invalid token format. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token || token.trim() === "") {
    res.status(401).json({ success: false, message: "Token is missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as string | JwtPayload;

    const userId =
      typeof decoded === "string" ? decoded : (decoded.userId as string | undefined);

    if (!userId) {
      res.status(401).json({ success: false, message: "Invalid token payload" });
      return;
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    const name = errName(error);

    if (name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token has expired" });
      return;
    }
    if (name === "JsonWebTokenError") {
      res.status(401).json({ success: false, message: "Invalid token signature" });
      return;
    }
    if (name === "NotBeforeError") {
      res.status(401).json({ success: false, message: "Token not active yet" });
      return;
    }

    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};
