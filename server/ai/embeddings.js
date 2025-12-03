import { getOpenAIClient } from "./openaiClient.js";

/**
 * Embeddings Module
 * 
 * Provides helper functions for generating text embeddings using OpenAI's
 * embedding models. Embeddings are vector representations of text that can
 * be used for semantic similarity search, recommendations, and clustering.
 * 
 * Architecture:
 * - Embeddings are generated using OpenAI's text-embedding-3-small model
 * - Vectors are stored in Pinecone (vector database) for similarity search
 * - MongoDB remains the source of truth for all car, booking, and user data
 * - Pinecone indexes (e.g., "car-recommendations") store embeddings with metadata
 *   linking back to MongoDB document IDs
 * 
 * Future use cases:
 * - Generate embeddings for car descriptions + trip storytelling context
 * - Store vectors in Pinecone index for fast similarity search
 * - Find similar cars based on user preferences using Pinecone query
 * - Recommend cars based on past bookings or search history
 * - Semantic search across car specs, features, and descriptions
 */

/**
 * Generates an embedding vector for the given text using OpenAI's embedding model.
 * 
 * The embedding is a high-dimensional vector (1536 dimensions for text-embedding-3-small)
 * that captures semantic meaning. Similar texts will have similar embeddings,
 * enabling similarity search and recommendations.
 * 
 * The returned embedding vector should be stored in Pinecone (vector database) along
 * with metadata linking to the source MongoDB document. Pinecone handles similarity
 * search efficiently at scale, while MongoDB stores the actual business data.
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]>} A promise that resolves to an array of numbers representing the embedding vector
 * @throws {Error} If OPENAI_API_KEY is not set or if embedding generation fails
 * 
 * @example
 * const embedding = await getEmbeddingForText("Luxury sedan with leather seats");
 * // Returns: [0.123, -0.456, 0.789, ...] (1536 numbers)
 * 
 * @example
 * // Future usage with Pinecone:
 * // 1. Generate embedding for car description
 * const carEmbedding = await getEmbeddingForText(car.description + " " + car.features);
 * // 2. Store in Pinecone with car._id as metadata
 * // await pineconeIndex.upsert([{ id: car._id, values: carEmbedding, metadata: {...} }]);
 * // 3. Query Pinecone for similar cars
 * // const results = await pineconeIndex.query({ vector: userQueryEmbedding, topK: 10 });
 * // 4. Fetch full car data from MongoDB using returned IDs
 */
export const getEmbeddingForText = async (text) => {
  try {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error("Text input must be a non-empty string");
    }
    
    // Get OpenAI client (will throw if API key is missing)
    const client = getOpenAIClient();
    
    // Generate embedding using OpenAI API
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.trim()
    });
    
    // Extract embedding vector from response
    // response.data[0].embedding is an array of numbers
    const embedding = response.data[0]?.embedding;
    
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from OpenAI");
    }
    
    // Return as native JavaScript array
    return embedding;
    
  } catch (error) {
    // Log error without exposing secrets
    console.error('[getEmbeddingForText] Error generating embedding:', {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw with generic error message
    if (error.message.includes("OPENAI_API_KEY")) {
      throw error; // Preserve the original error message for missing API key
    }
    
    throw new Error("Failed to generate embedding");
  }
};

