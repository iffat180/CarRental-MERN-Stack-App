import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

/**
 * TEST CASES:
 * 
 * 1. Mountain Trip:
 *    Input: "family SUV for mountain road trip with luggage"
 *    Expected: Jeep Grand Cherokee, Toyota RAV4, Range Rover Evoque ranked high
 * 
 * 2. Eco-Friendly:
 *    Input: "electric car for daily city commuting"
 *    Expected: Tesla Model 3, Ford Focus, KIA EV9 ranked high
 * 
 * 3. Sports/Performance:
 *    Input: "fun sports car for weekend getaway"
 *    Expected: Chevrolet Camaro, BMW 4-Series, BMW M5 ranked high
 * 
 * 4. Luxury Business:
 *    Input: "premium luxury sedan for business meetings"
 *    Expected: BMW M5, Mercedes A-Class, Audi A5 ranked high
 * 
 * 5. Large Family:
 *    Input: "7 seater for big family vacation"
 *    Expected: KIA EV9 ranked #1 (only 7-seater)
 * 
 * 6. Budget:
 *    Input: "cheap reliable car for basic transportation"
 *    Expected: Lower priced cars ranked higher
 */

/**
 * Query Complexity Detection Helper (Solution 4)
 * Detects when query contains multiple different needs or chained time periods
 * 
 * @param {string} query - User's search query
 * @returns {Object} { isComplex: boolean, message?: string, suggestions?: string[] }
 */
const simplifyQuery = (query) => {
  const queryLower = query.toLowerCase();
  
  // Time period chaining indicators
  const timeChainingWords = ["then", "later", "also", "after", "and then", "plus", "followed by", "next"];
  const hasTimeChaining = timeChainingWords.some(word => queryLower.includes(word));
  
  // Multiple need indicators (different use cases in one query)
  const needSeparators = [" and ", " or ", " but ", " plus ", " also ", " as well as "];
  const hasMultipleNeeds = needSeparators.some(separator => queryLower.includes(separator));
  
  // Count distinct use case keywords
  const useCaseKeywords = [
    ["party", "social", "date", "nightlife", "impress"],
    ["office", "work", "commute", "business", "meeting"],
    ["family", "kids", "group", "friends"],
    ["road trip", "vacation", "travel", "journey"],
    ["mountain", "adventure", "off-road", "camping"],
    ["budget", "cheap", "affordable", "economical"],
    ["luxury", "premium", "executive"],
    ["sport", "fun", "performance", "fast"]
  ];
  
  let matchedUseCases = 0;
  useCaseKeywords.forEach(keywords => {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      matchedUseCases++;
    }
  });
  
  // Consider complex if:
  // 1. Has time chaining words
  // 2. Has multiple needs separated by conjunctions
  // 3. Matches 3+ different use cases
  const isComplex = hasTimeChaining || hasMultipleNeeds || matchedUseCases >= 3;
  
  if (isComplex) {
    const suggestions = [
      "car for party with friends",
      "fuel efficient hybrid car for office",
      "family SUV for road trip",
      "luxury sedan for business meetings"
    ];
    
    return {
      isComplex: true,
      message: "Your search has multiple mixed needs. Try one at a time.",
      suggestions: suggestions
    };
  }
  
  return { isComplex: false };
};

const AISearch = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  // AI Recommendations State
  const [aiQuery, setAiQuery] = useState("");
  const [tripDays, setTripDays] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);

  const getSmartRecommendations = async () => {
    // Validation
    if (!aiQuery.trim() || aiQuery.trim().length < 3) {
      setAiError("Please enter at least 3 characters");
      return;
    }

    if (tripDays < 1 || tripDays > 30 || isNaN(tripDays)) {
      setAiError("Trip days must be between 1 and 30");
      return;
    }

    // Query complexity detection (Solution 4)
    const complexityCheck = simplifyQuery(aiQuery.trim());
    if (complexityCheck.isComplex) {
      setAiError(complexityCheck.message);
      if (complexityCheck.suggestions) {
        setAiError(`${complexityCheck.message} Examples: ${complexityCheck.suggestions.slice(0, 2).join(", ")}`);
      }
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const response = await axios.post("/api/recommendations", {
        query: aiQuery.trim(),
        tripDays: Number(tripDays),
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || "Failed to get recommendations");
      }

      // Handle low-confidence response (can be array or object with lowConfidence flag)
      if (data.lowConfidence && data.recommendations) {
        setAiRecommendations(data.recommendations);
        // Show low-confidence message as info, not error
        if (data.message) {
          setAiError(data.message);
        }
      } else {
        setAiRecommendations(data.recommendations || []);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unable to get recommendations. Please try again.";
      setAiError(errorMessage);
      setAiRecommendations([]);
    } finally {
      setAiLoading(false);
    }
  };

  const clearRecommendations = () => {
    setAiQuery("");
    setTripDays(3);
    setAiRecommendations([]);
    setAiError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !aiLoading) {
      getSmartRecommendations();
    }
  };

  return (
    <section className="w-full px-6 md:px-16 lg:px-24 xl:px-32 py-12 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            🤖 AI-Powered Smart Recommendations
          </h2>
          <p className="text-gray-600 text-lg">
            Describe your ideal car in natural language and get personalized recommendations
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => {
                  setAiQuery(e.target.value);
                  setAiError("");
                }}
                onKeyPress={handleKeyPress}
                placeholder="e.g., family SUV for mountain road trip with luggage"
                className="w-full px-4 py-3 border border-borderColor rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={aiLoading}
              />
            </div>
            <div className="w-full sm:w-32">
              <input
                type="number"
                value={tripDays}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 30) {
                    setTripDays(value);
                    setAiError("");
                  }
                }}
                min="1"
                max="30"
                placeholder="Days"
                className="w-full px-4 py-3 border border-borderColor rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={aiLoading}
              />
              <label className="text-xs text-gray-500 mt-1 block text-center">
                Trip Days
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={getSmartRecommendations}
                disabled={aiLoading || !aiQuery.trim() || aiQuery.trim().length < 3}
                className={`px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dull transition-all ${
                  aiLoading || !aiQuery.trim() || aiQuery.trim().length < 3
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {aiLoading ? "Loading..." : "Get Recommendations"}
              </button>
              {aiRecommendations.length > 0 && (
                <button
                  onClick={clearRecommendations}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {aiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{aiError}</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {aiLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-gray-500">Finding the perfect cars for you...</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {!aiLoading && aiRecommendations.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                Top {aiRecommendations.length} Recommendation
                {aiRecommendations.length !== 1 ? "s" : ""}
              </h3>
              <span className="text-sm text-gray-500">
                Powered by AI semantic search
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiRecommendations.map((car) => (
                <div
                  key={car.car_id}
                  onClick={() => {
                    navigate(`/car-details/${car.car_id}`);
                    scrollTo(0, 0);
                  }}
                  className="group rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-500 cursor-pointer bg-white"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {car.rank}
                  </div>

                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                      <span className="font-semibold">
                        {currency}
                        {car.pricePerDay}
                      </span>
                      <span className="text-sm text-white/80"> / day</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {car.category} • {car.year}
                        </p>
                      </div>
                    </div>

                    {/* AI Reason */}
                    <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                      <p className="text-xs font-medium text-primary mb-1">
                        💡 Why recommended:
                      </p>
                      <p className="text-xs text-gray-700">{car.reason}</p>
                    </div>

                    {/* Score Badge (Optional) */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span>Match Score: {(car.score * 100).toFixed(0)}%</span>
                      {car.boostScore > 0 && (
                        <span className="text-green-600">
                          (+{(car.boostScore * 100).toFixed(0)}% boost)
                        </span>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="mt-4 grid grid-cols-2 gap-y-2 text-gray-600">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <img src={assets.location_icon} alt="" className="h-4 mr-2" />
                        <span>{car.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <img src={assets.users_icon} alt="" className="h-4 mr-2" />
                        <span>{car.seating_capacity} Seats</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No Results */}
        {!aiLoading &&
          aiRecommendations.length === 0 &&
          aiQuery.trim().length >= 3 &&
          !aiError && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">
                No matches found. Try different keywords.
              </p>
              <p className="text-gray-400 text-sm">
                Example: "luxury sedan", "family SUV", "electric car"
              </p>
            </div>
          )}
      </div>
    </section>
  );
};

export default AISearch;

