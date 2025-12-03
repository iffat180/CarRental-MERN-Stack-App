import OpenAI from "openai";

/**
 * OpenAI Client Module
 * 
 * Provides a singleton OpenAI client instance with lazy initialization.
 * The client is only created when first accessed, and only if OPENAI_API_KEY is set.
 * 
 * This module centralizes all OpenAI SDK access to ensure consistent configuration
 * and error handling across all AI features (embeddings, chat, vision).
 */

let openaiClient = null;

/**
 * Gets or creates the OpenAI client instance (singleton pattern).
 * 
 * The client is lazily initialized on first access. If OPENAI_API_KEY is not set,
 * this function will throw an error. This allows the server to start without
 * the API key, but AI features will fail with a clear error message when called.
 * 
 * @returns {OpenAI} The initialized OpenAI client instance
 * @throws {Error} If OPENAI_API_KEY is not set in environment variables
 * 
 * @example
 * const client = getOpenAIClient();
 * const response = await client.embeddings.create({ ... });
 */
export const getOpenAIClient = () => {
  // Lazy initialization: only create client when first accessed
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. AI features are disabled."
      );
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey
    });
  }
  
  return openaiClient;
};

