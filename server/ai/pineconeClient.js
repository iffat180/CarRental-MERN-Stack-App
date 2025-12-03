import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Pinecone Client Module
 * 
 * Provides a singleton Pinecone client instance with lazy initialization.
 * The client is only created when first accessed, and only if PINECONE_API_KEY is set.
 * 
 * This module centralizes all Pinecone SDK access to ensure consistent configuration
 * and error handling across all vector database operations (embeddings storage, similarity search).
 */

let pineconeInstance = null;

/**
 * Gets or creates the Pinecone client instance (singleton pattern).
 * 
 * The client is lazily initialized on first access. If PINECONE_API_KEY is not set,
 * this function will throw an error. This allows the server to start without
 * the API key, but vector database features will fail with a clear error message when called.
 * 
 * @returns {Pinecone} The initialized Pinecone client instance
 * @throws {Error} If PINECONE_API_KEY is not set in environment variables
 * 
 * @example
 * const client = getPineconeClient();
 * const index = client.index("car-recommendations");
 * const queryResponse = await index.query({ ... });
 */
export const getPineconeClient = () => {
  // Lazy initialization: only create client when first accessed
  if (!pineconeInstance) {
    const apiKey = process.env.PINECONE_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "PINECONE_API_KEY is not set. Vector database features are disabled."
      );
    }
    
    pineconeInstance = new Pinecone({
      apiKey: apiKey
    });
  }
  
  return pineconeInstance;
};

