/**
 * Pinecone Vector Seeder
 * 
 * Seeds car embeddings into Pinecone vector database for semantic similarity search.
 * 
 * This script:
 * 1. Fetches all available cars from MongoDB
 * 2. Generates embeddings for each car's story (brand, model, specs, tags, description)
 * 3. Upserts vectors to Pinecone index "car-recommendations"
 * 
 * SEEDING TEST CASES:
 * After running this script, these searches should work:
 * 
 * 1. "mountain 4WD SUV" → Should find Jeep Grand Cherokee, Toyota RAV4
 * 2. "electric city car" → Should find Tesla Model 3, Ford Focus, KIA EV9
 * 3. "luxury sedan" → Should find BMW M5, Mercedes A-Class, Audi A5
 * 4. "family road trip" → Should find KIA EV9, Jeep Grand Cherokee
 * 5. "budget car" → Should find BMW M5 ($95/day)
 * 6. "sports car" → Should find Chevrolet Camaro, BMW 4-Series
 */

import "dotenv/config";
import mongoose from "mongoose";
import { getEmbeddingForText } from "./embeddings.js";
import { getPineconeClient } from "./pineconeClient.js";
import Car from "../models/Car.js";

/**
 * Builds a descriptive story text from car attributes for embedding generation.
 * 
 * Combines: brand, model, year, category, seating, fuel_type, transmission,
 * trunk_capacity, mpg, tags, and description.
 * 
 * Excludes: pricePerDay, location, owner, _id, image (these go in metadata only)
 * 
 * @param {Object} car - Car document from MongoDB
 * @returns {string} Descriptive story text for embedding
 */
function buildCarStory(car) {
  const parts = [];

  // Basic info: brand, model, year
  if (car.brand && car.model && car.year) {
    parts.push(`${car.year} ${car.brand} ${car.model}.`);
  }

  // Category
  if (car.category) {
    parts.push(`Category: ${car.category}.`);
  }

  // Seating capacity
  if (car.seating_capacity) {
    parts.push(`Seating: ${car.seating_capacity} passenger${car.seating_capacity !== 1 ? 's' : ''}.`);
  }

  // Fuel type
  if (car.fuel_type) {
    parts.push(`Fuel: ${car.fuel_type}.`);
  }

  // Transmission
  if (car.transmission) {
    parts.push(`Transmission: ${car.transmission}.`);
  }

  // Trunk capacity
  if (car.trunk_capacity) {
    parts.push(`Trunk capacity: ${car.trunk_capacity}L.`);
  }

  // MPG
  if (car.mpg) {
    parts.push(`MPG: ${car.mpg}.`);
  }

  // Tags (array - join with commas)
  if (car.tags && Array.isArray(car.tags) && car.tags.length > 0) {
    const tagsText = car.tags.join(", ");
    parts.push(`Tags: ${tagsText}.`);
  }

  // Description
  if (car.description) {
    parts.push(car.description);
  }

  return parts.join(" ");
}

/**
 * Main function to seed car vectors into Pinecone.
 * 
 * Steps:
 * 1. Connect to MongoDB
 * 2. Fetch all available cars
 * 3. For each car: build story, generate embedding, create vector object
 * 4. Batch upsert all vectors to Pinecone index "car-recommendations"
 * 5. Disconnect from MongoDB
 */
async function seedCarVectors() {
  try {
    // Step 1: Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    // Step 2: Fetch all available cars
    console.log("📦 Fetching cars from MongoDB...");
    const cars = await Car.find({ isAvailable: true }).lean();
    
    if (!cars || cars.length === 0) {
      console.log("⚠️ No available cars found. Nothing to seed.");
      return;
    }

    console.log(`✅ Found ${cars.length} available car(s)`);

    // Step 3: Process each car and create vectors
    console.log("🚀 Generating embeddings and preparing vectors...");
    const vectors = [];

    for (const car of cars) {
      try {
        console.log(`🚗 Processing: ${car.brand} ${car.model}`);

        // Build car story text
        const story = buildCarStory(car);
        
        if (!story || story.trim().length === 0) {
          console.warn(`⚠️ Skipping ${car.brand} ${car.model}: empty story text`);
          continue;
        }

        // Generate embedding
        const embedding = await getEmbeddingForText(story);

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
          console.warn(`⚠️ Skipping ${car.brand} ${car.model}: invalid embedding`);
          continue;
        }

        // Create vector object
        const vector = {
          id: car._id.toString(),
          values: embedding, // array of 1536 numbers
          metadata: {
            mongo_id: car._id.toString(),
            brand: car.brand || "",
            model: car.model || "",
            year: car.year || 0,
            category: car.category || "",
            seating_capacity: car.seating_capacity || 0,
            fuel_type: car.fuel_type || "",
            transmission: car.transmission || "",
            pricePerDay: car.pricePerDay || 0,
            location: car.location || "",
            trunk_capacity: car.trunk_capacity || 0,
            mpg: car.mpg || 0,
            tags: car.tags || [],
            isAvailable: car.isAvailable !== undefined ? car.isAvailable : true
          }
        };

        vectors.push(vector);
        console.log(`  ✅ Generated embedding (${embedding.length} dimensions)`);

      } catch (error) {
        console.error(`❌ Error processing ${car.brand} ${car.model}:`, {
          message: error.message,
          name: error.name
        });
        // Continue with next car instead of failing entire batch
        continue;
      }
    }

    if (vectors.length === 0) {
      console.log("⚠️ No vectors generated. Nothing to upsert.");
      return;
    }

    console.log(`\n📤 Upserting ${vectors.length} vector(s) to Pinecone...`);

    // Step 4: Batch upsert to Pinecone
    try {
      const pinecone = getPineconeClient();
      const index = pinecone.index("car-recommendations");
      
      // Upsert all vectors at once using default namespace
      await index.namespace("default").upsert(vectors);
      
      console.log(`✅ Successfully upserted ${vectors.length} vector(s) to Pinecone index "car-recommendations"`);
      console.log("✅ Seeding complete!");

    } catch (error) {
      console.error("❌ Error upserting to Pinecone:", {
        message: error.message,
        name: error.name
      });
      throw error;
    }

  } catch (error) {
    // Log structured errors (no API keys in logs)
    console.error("❌ Seeding failed:", {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    throw error;
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("✅ Disconnected from MongoDB");
    }
  }
}

// Execute seeding (only runs when script is executed directly, not on import)
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('seedCarVectors.js');

if (isMainModule) {
  seedCarVectors()
    .then(() => {
      console.log("\n🎉 Seeding completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n💥 Seeding failed:", err.message);
      process.exit(1);
    });
}

export default seedCarVectors;

