import { getEmbeddingForText } from "./embeddings.js";
import { getPineconeClient } from "./pineconeClient.js";
import Car from "../models/Car.js";

/**
 * Recommendation Service Module
 * 
 * Provides smart car recommendations based on user queries using semantic similarity search.
 * 
 * Architecture:
 * - Generates embeddings from user queries using OpenAI
 * - Queries Pinecone vector database for similar cars
 * - Fetches full car details from MongoDB
 * - Returns ranked recommendations based on semantic similarity
 * 
 * Future enhancements:
 * - Boost rules for trip duration, availability, price range
 * - Filter by location, category, or other attributes
 * - Personalization based on user booking history
 */

/**
 * Recommends cars based on a natural language user query using semantic similarity.
 * 
 * This function performs the following steps:
 * 1. Generates an embedding vector from the user query
 * 2. Queries Pinecone index "car-recommendations" for similar cars (topK: 10)
 * 3. Fetches full car details from MongoDB (only available cars)
 * 4. Applies intelligent boost rules based on query keywords and car attributes
 * 5. Returns top 5 ranked results with similarity scores, boost scores, and reasons
 * 
 * @param {string} userQuery - Natural language query describing desired car (e.g., "luxury SUV for family trip")
 * @param {number} tripDays - Number of days for the trip (default: 3)
 * @returns {Promise<Array>} Promise that resolves to array of top 5 recommended cars
 *   Each car object includes:
 *   - All car fields from MongoDB (car_id, brand, model, year, category, pricePerDay, location, image, etc.)
 *   - score: final score (similarityScore + boostScore)
 *   - similarityScore: original Pinecone similarity score (0-1)
 *   - boostScore: total boost applied from matching rules
 *   - reason: combined reason string explaining why car was recommended
 *   - rank: position in recommendations (1-based)
 * @throws {Error} If embedding generation fails, Pinecone query fails, or MongoDB fetch fails
 * 
 * @example
 * // Test case 1: Mountain/Off-Road
 * await recommendSmartCars("rugged 4WD for mountain camping with equipment");
 * 
 * @example
 * // Test case 2: Electric
 * await recommendSmartCars("electric car for daily city commuting");
 * 
 * @example
 * // Test case 3: Large Groups
 * await recommendSmartCars("7-seater SUV for family road trip");
 * 
 * @example
 * // Test case 4: Performance
 * await recommendSmartCars("fun sports car for weekend");
 * 
 * @example
 * // Test case 5: Luxury
 * await recommendSmartCars("premium luxury sedan for business");
 * 
 * @example
 * // Test case 6: Budget
 * await recommendSmartCars("affordable reliable car");
 * 
 * @example
 * // Test case 7: Mountain/Off-Road (snow)
 * await recommendSmartCars("safe vehicle for snowy mountain roads");
 * 
 * @example
 * // Test case 8: Electric + Family
 * await recommendSmartCars("electric SUV with space for family");
 */
export const recommendSmartCars = async (userQuery, tripDays = 3) => {
  try {
    // Validate input
    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      throw new Error("User query must be a non-empty string");
    }

    if (typeof tripDays !== 'number' || tripDays < 1) {
      throw new Error("Trip days must be a positive number");
    }

    // Step 1: Generate embedding from user query
    let queryEmbedding;
    try {
      queryEmbedding = await getEmbeddingForText(userQuery.trim());
    } catch (error) {
      console.error('[recommendSmartCars] Error generating embedding:', {
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error("Failed to generate embedding for user query");
    }

    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Invalid embedding generated");
    }

    // Step 2: Query Pinecone index "car-recommendations"
    let queryResults;
    try {
      const pinecone = getPineconeClient();
      const index = pinecone.index("car-recommendations");
      
      queryResults = await index.namespace("default").query({
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true
      });
    } catch (error) {
      console.error('[recommendSmartCars] Error querying Pinecone:', {
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error("Failed to query vector database");
    }

    if (!queryResults || !queryResults.matches || queryResults.matches.length === 0) {
      // No matches found - return empty array
      return [];
    }

    // Step 3: Extract car IDs from Pinecone results
    const carIds = queryResults.matches
      .map(match => match.id)
      .filter(id => id); // Filter out any null/undefined IDs

    if (carIds.length === 0) {
      return [];
    }

    // Step 4: Fetch cars from MongoDB (only available cars)
    let cars;
    try {
      cars = await Car.find({
        _id: { $in: carIds },
        isAvailable: true
      }).lean(); // Use lean() for better performance since we're just reading
    } catch (error) {
      console.error('[recommendSmartCars] Error fetching cars from MongoDB:', {
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error("Failed to fetch car details from database");
    }

    if (!cars || cars.length === 0) {
      return [];
    }

    // Step 5: Combine Pinecone scores with MongoDB car data
    // Create a map of car ID to score for quick lookup
    const scoreMap = new Map();
    queryResults.matches.forEach(match => {
      if (match.id && match.score !== undefined) {
        scoreMap.set(match.id.toString(), match.score);
      }
    });

    // Normalize user query to lowercase for keyword matching
    const queryLower = userQuery.toLowerCase();

    // Step 6: Apply intelligent boost rules
    const recommendations = cars
      .map(car => {
        const carIdStr = car._id.toString();
        const similarityScore = scoreMap.get(carIdStr) || 0;
        
        if (similarityScore === 0) {
          return null; // Skip cars without similarity match
        }

        let boostScore = 0;
        const reasons = [];

        // Helper function to check if tags include any of the given values
        const hasTag = (tagValues) => {
          if (!car.tags || !Array.isArray(car.tags)) return false;
          const carTagsLower = car.tags.map(t => t.toLowerCase());
          return tagValues.some(tag => carTagsLower.includes(tag.toLowerCase()));
        };

        // Helper function to check if query contains any keywords
        const hasKeyword = (keywords) => {
          return keywords.some(keyword => queryLower.includes(keyword.toLowerCase()));
        };

        // RULE 1 - Mountain/Off-Road (+0.15)
        const mountainKeywords = ["mountain", "trail", "off-road", "snow", "winter", "4wd", "awd"];
        const mountainTags = ["AWD", "4WD", "Off-Road", "Mountain"];
        if (hasKeyword(mountainKeywords) && hasTag(mountainTags)) {
          boostScore += 0.15;
          reasons.push("Recommended for mountain/off-road conditions");
        }

        // RULE 2 - Family/Luggage (+0.12)
        const familyKeywords = ["family", "luggage", "cargo", "space", "kids", "group"];
        if (hasKeyword(familyKeywords) && car.trunk_capacity && car.trunk_capacity > 500) {
          boostScore += 0.12;
          reasons.push(`Large trunk capacity (${car.trunk_capacity} L) for family/luggage`);
        }

        // RULE 3 - Fuel Efficiency (+0.10)
        const fuelKeywords = ["fuel efficient", "eco", "economy", "mpg", "city"];
        if (hasKeyword(fuelKeywords) && car.mpg && car.mpg > 30) {
          boostScore += 0.10;
          reasons.push(`Excellent fuel economy (${car.mpg} MPG)`);
        }

        // RULE 4 - Electric (+0.15)
        const electricKeywords = ["electric", "ev", "zero emission", "eco-friendly"];
        const isElectric = car.fuel_type === "Electric" || hasTag(["Electric"]);
        if (hasKeyword(electricKeywords) && isElectric) {
          boostScore += 0.15;
          reasons.push("Zero emissions electric vehicle");
        }

        // RULE 5 - Luxury (+0.10)
        const luxuryKeywords = ["luxury", "premium", "executive", "business"];
        const isLuxury = hasTag(["Luxury"]) || (car.pricePerDay && car.pricePerDay > 150);
        if (hasKeyword(luxuryKeywords) && isLuxury) {
          boostScore += 0.10;
          reasons.push("Premium luxury experience");
        }

        // RULE 6 - Performance (+0.12)
        const performanceKeywords = ["sport", "fast", "performance", "fun"];
        const performanceTags = ["Sport", "Performance", "Muscle"];
        if (hasKeyword(performanceKeywords) && hasTag(performanceTags)) {
          boostScore += 0.12;
          reasons.push("High-performance vehicle");
        }

        // RULE 7 - Large Groups (+0.20)
        const largeGroupKeywords = ["7 seater", "7-seater", "large group"];
        if (hasKeyword(largeGroupKeywords) && car.seating_capacity && car.seating_capacity >= 7) {
          boostScore += 0.20;
          reasons.push(`Seats ${car.seating_capacity} passengers comfortably`);
        }

        // RULE 8 - Budget (+0.08)
        const budgetKeywords = ["cheap", "budget", "affordable", "low cost"];
        if (hasKeyword(budgetKeywords) && car.pricePerDay && car.pricePerDay < 120) {
          boostScore += 0.08;
          reasons.push(`Budget-friendly at $${car.pricePerDay}/day`);
        }

        // RULE 9 - Party/Social/Impress (+0.15)
        const partyKeywords = ["party", "impress", "social", "date", "nightlife", "romantic", "photogenic", "stylish", "head turner"];
        const partyTags = ["Stylish", "Sport", "Convertible", "Luxury", "Photogenic", "Romantic"];
        const isPartyCar = hasTag(partyTags) || (car.category === "Convertible") || (hasTag(["Luxury"]) && car.pricePerDay > 150);
        if (hasKeyword(partyKeywords) && isPartyCar) {
          boostScore += 0.15;
          reasons.push("Perfect for social events and making an impression");
        }

        // RULE 10 - Office/Work/Commute (+0.12)
        const officeKeywords = ["office", "work", "commute", "daily", "business", "professional", "meeting", "client"];
        const isCommuteEfficient = (car.mpg && car.mpg > 30) || hasTag(["Fuel-Efficient", "Eco", "Hybrid", "Commute"]);
        const isProfessional = hasTag(["Executive", "Business", "Premium"]) || (car.pricePerDay > 150 && car.category === "Sedan");
        if (hasKeyword(officeKeywords) && (isCommuteEfficient || isProfessional)) {
          boostScore += 0.12;
          if (isCommuteEfficient) {
            reasons.push(`Excellent for daily commutes with ${car.mpg} MPG fuel economy`);
          } else {
            reasons.push("Professional appearance for business meetings");
          }
        }

        // RULE 11 - Group Travel Seating (+0.18)
        const groupKeywords = ["group", "friends", "multiple", "several", "together", "carpool"];
        if (hasKeyword(groupKeywords) && car.seating_capacity && car.seating_capacity >= 6) {
          boostScore += 0.18;
          reasons.push(`Accommodates ${car.seating_capacity} passengers for group travel`);
        }

        // RULE 12 - Multi-purpose SUV Versatility (+0.10)
        const versatileKeywords = ["versatile", "multi-purpose", "all-around", "do everything", "practical", "utility"];
        const isVersatileSUV = (car.category === "SUV") && (car.trunk_capacity && car.trunk_capacity > 600) && hasTag(["Practical", "Versatile", "Spacious"]);
        if (hasKeyword(versatileKeywords) && isVersatileSUV) {
          boostScore += 0.10;
          reasons.push("Versatile SUV perfect for various needs");
        }

        // RULE 13 - Road Trip Cargo/Comfort (+0.14)
        const roadTripKeywords = ["road trip", "long drive", "highway", "journey", "travel", "trip", "vacation"];
        const hasRoadTripFeatures = (car.trunk_capacity && car.trunk_capacity > 700) || 
                                    (car.seating_capacity >= 5 && hasTag(["Comfortable", "Spacious"])) ||
                                    (car.mpg && car.mpg > 28);
        if (hasKeyword(roadTripKeywords) && hasRoadTripFeatures) {
          boostScore += 0.14;
          if (car.trunk_capacity > 700) {
            reasons.push(`Large cargo space (${car.trunk_capacity}L) perfect for road trips`);
          } else if (hasTag(["Comfortable"])) {
            reasons.push("Comfortable for long journeys");
          } else {
            reasons.push(`Fuel-efficient (${car.mpg} MPG) for extended travel`);
          }
        }

        // RULE 14 - Mountain/Weather Capable AWD (+0.16)
        const weatherKeywords = ["weather", "rain", "snow", "winter", "all-weather", "conditions", "adventure", "outdoor"];
        const isWeatherCapable = hasTag(["AWD", "4WD", "All-Weather", "Adventure"]) || 
                                 (car.category === "SUV" && hasTag(["Reliable", "Adventure"]));
        if (hasKeyword(weatherKeywords) && isWeatherCapable) {
          boostScore += 0.16;
          reasons.push("All-weather capable for challenging conditions");
        }

        // RULE 15 - Budget Rentals High-MPG Low Price (+0.11)
        const budgetRentalKeywords = ["economical", "save money", "cost-effective", "frugal", "minimal cost"];
        const isBudgetRental = (car.pricePerDay && car.pricePerDay < 100) && (car.mpg && car.mpg > 30);
        if (hasKeyword(budgetRentalKeywords) && isBudgetRental) {
          boostScore += 0.11;
          reasons.push(`Ultra-economical: $${car.pricePerDay}/day with ${car.mpg} MPG`);
        }

        // RULE 16 - New Tech/Electric Experience (+0.13)
        const techKeywords = ["tech", "technology", "modern", "innovation", "future", "cutting-edge", "advanced"];
        const isTechCar = car.fuel_type === "Electric" || hasTag(["Tech", "Modern", "Innovation", "Zero-Emission"]);
        if (hasKeyword(techKeywords) && isTechCar) {
          boostScore += 0.13;
          reasons.push("Cutting-edge technology and modern driving experience");
        }

        // RULE 17 - Photo-friendly/Aesthetic (+0.09)
        const photoKeywords = ["photo", "photogenic", "aesthetic", "beautiful", "stunning", "gorgeous", "instagram", "pictures"];
        const isPhotoFriendly = hasTag(["Stylish", "Photogenic", "Sport", "Convertible"]) || 
                                (car.category === "Convertible") ||
                                (hasTag(["Luxury"]) && car.pricePerDay > 150);
        if (hasKeyword(photoKeywords) && isPhotoFriendly) {
          boostScore += 0.09;
          reasons.push("Stylish and photogenic design");
        }

        // RULE 18 - Winter-ready/Snow Confidence (+0.15)
        const winterKeywords = ["winter", "snow", "snowy", "cold", "ice", "slippery", "winter driving"];
        const isWinterReady = hasTag(["AWD", "4WD", "All-Weather"]) || 
                             (car.category === "SUV" && hasTag(["Reliable", "Adventure"]));
        if (hasKeyword(winterKeywords) && isWinterReady) {
          boostScore += 0.15;
          reasons.push("Winter-ready with all-wheel drive capability");
        }

        // Calculate final score
        const finalScore = similarityScore + boostScore;

        // Combine all reasons into one string
        const reason = reasons.length > 0 
          ? reasons.join(". ") 
          : "Matched your search criteria";

        return {
          car_id: car._id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          category: car.category,
          pricePerDay: car.pricePerDay,
          location: car.location,
          image: car.image,
          description: car.description,
          seating_capacity: car.seating_capacity,
          fuel_type: car.fuel_type,
          transmission: car.transmission,
          mpg: car.mpg,
          trunk_capacity: car.trunk_capacity,
          tags: car.tags,
          isAvailable: car.isAvailable,
          score: finalScore,
          similarityScore: similarityScore,
          boostScore: boostScore,
          reason: reason
        };
      })
      .filter(car => car !== null) // Remove null entries
      .sort((a, b) => b.score - a.score) // Sort by final score descending
      .slice(0, 5) // Return top 5 only
      .map((car, index) => ({
        ...car,
        rank: index + 1 // Assign rank after sorting
      }));

    // Step 7: Low-confidence check (Solution 3)
    // If best score is below threshold, flag as low confidence
    const bestScore = recommendations.length > 0 ? recommendations[0].score : 0;
    const lowConfidence = bestScore < 0.40;

    // Return results with low-confidence flag if applicable
    if (lowConfidence && recommendations.length > 0) {
      return {
        lowConfidence: true,
        message: "Results may not perfectly match your search. Try refining your query with more specific keywords.",
        recommendations: recommendations
      };
    }

    return recommendations;

  } catch (error) {
    // Log error without exposing internal details
    console.error('[recommendSmartCars] Error in recommendation service:', {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });

    // Re-throw with user-friendly message if it's our own error
    if (error.message.includes("must be") || error.message.includes("Failed to")) {
      throw error;
    }

    // For unexpected errors, throw generic message
    throw new Error("Failed to generate car recommendations");
  }
};

