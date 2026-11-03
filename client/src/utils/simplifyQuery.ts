/**
 * Query complexity check for the AI trip search.
 * A query with several different needs (or "then ... later" chains) gets a
 * friendly "try one at a time" message instead of a poor recommendation.
 * Moved here from the old AISearch component so the new home page can use it.
 */
export const simplifyQuery = (
  query: string
): { isComplex: boolean; message?: string; suggestions?: string[] } => {
  const queryLower = query.toLowerCase();

  // Time period chaining indicators
  const timeChainingWords = [
    "then",
    "later",
    "also",
    "after",
    "and then",
    "plus",
    "followed by",
    "next",
  ];
  const hasTimeChaining = timeChainingWords.some((word) => queryLower.includes(word));

  // Multiple need indicators (different use cases in one query)
  const needSeparators = [" and ", " or ", " but ", " plus ", " also ", " as well as "];
  const hasMultipleNeeds = needSeparators.some((separator) => queryLower.includes(separator));

  // Count distinct use case keywords
  const useCaseKeywords = [
    ["party", "social", "date", "nightlife", "impress"],
    ["office", "work", "commute", "business", "meeting"],
    ["family", "kids", "group", "friends"],
    ["road trip", "vacation", "travel", "journey"],
    ["mountain", "adventure", "off-road", "camping"],
    ["budget", "cheap", "affordable", "economical"],
    ["luxury", "premium", "executive"],
    ["sport", "fun", "performance", "fast"],
  ];

  let matchedUseCases = 0;
  useCaseKeywords.forEach((keywords) => {
    if (keywords.some((keyword) => queryLower.includes(keyword))) {
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
      "luxury sedan for business meetings",
    ];

    return {
      isComplex: true,
      message: "Your search has multiple mixed needs. Try one at a time.",
      suggestions: suggestions,
    };
  }

  return { isComplex: false };
};
