/**
 * AI Module Index
 * 
 * Central export point for all AI-related functionality.
 * This allows other parts of the application to import AI helpers
 * from a single location: import { ... } from './ai/index.js'
 * 
 * No side effects, no logic - just re-exports.
 */

export { getOpenAIClient } from "./openaiClient.js";
export { getEmbeddingForText } from "./embeddings.js";
export { runAssistantConversation } from "./assistantCore.js";
export { analyzeCarImages } from "./visionCore.js";

