export const requireOwner = (req, res, next) => {
  // Check if user exists (should be set by protect middleware)
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "Authentication required"
    });
  }

  // Check if user is owner
  if (req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Owner role required."
    });
  }

  // User is owner, proceed
  next();
};

