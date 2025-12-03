import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  // Check if authorization header exists
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required. Please log in to access this resource." 
    });
  }

  // Check if token is in "Bearer <token>" format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token format. Expected: Bearer <token>" 
    });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token || token.trim() === '') {
    return res.status(401).json({ 
      success: false, 
      message: "Token is missing" 
    });
  }

  try {
    // Verify token using jwt.verify() instead of jwt.decode()
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if decoded payload exists
    // Note: Based on generateToken(), the payload is the userId string directly
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token payload" 
      });
    }

    // Extract userId (could be string directly or object with userId property)
    const userId = typeof decoded === 'string' ? decoded : decoded.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token payload" 
      });
    }

    // Find user by ID from decoded token
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token has expired" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token signature" 
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token not active yet" 
      });
    }

    // Generic error for other cases
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
}