/**
 * Recommendation Routes
 * Handles AI-powered car recommendations based on natural language queries
 */

import express from "express";
import { recommendSmartCars } from "../ai/recommendationService.js";
import { userLimiter } from "../middleware/rateLimiters.js";

const recommendationRouter = express.Router();

/**
 * POST /api/recommendations
 * Get smart car recommendations based on natural language query
 * Uses semantic similarity search with intelligent boost rules
 * Middleware: userLimiter → recommendation handler
 */
recommendationRouter.post('/recommendations', userLimiter, async (req, res, next) => {
  try {
    const { query, tripDays = 3 } = req.body;

    // Validation: query must be a string with at least 3 characters
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "Query must be a string with at least 3 characters"
      });
    }

    // Validation: tripDays must be a number between 1 and 30
    const tripDaysNum = Number(tripDays);
    if (isNaN(tripDaysNum) || tripDaysNum < 1 || tripDaysNum > 30) {
      return res.status(400).json({
        success: false,
        error: "Trip days must be a number between 1 and 30"
      });
    }

    // Call recommendation service
    const result = await recommendSmartCars(query.trim(), tripDaysNum);

    // Handle both array response and low-confidence object response
    if (Array.isArray(result)) {
      // Normal response (array of recommendations)
      res.json({
        success: true,
        count: result.length,
        recommendations: result
      });
    } else if (result && result.lowConfidence) {
      // Low-confidence response (object with flag)
      res.json({
        success: true,
        count: result.recommendations ? result.recommendations.length : 0,
        lowConfidence: true,
        message: result.message,
        recommendations: result.recommendations || []
      });
    } else {
      // Fallback
      res.json({
        success: true,
        count: 0,
        recommendations: []
      });
    }

  } catch (error) {
    // Forward errors to error handling middleware
    next(error);
  }
});

export default recommendationRouter;

