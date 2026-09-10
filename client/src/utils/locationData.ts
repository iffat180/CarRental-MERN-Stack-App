/**
 * Location data for car rental pickup/dropoff locations
 * Structured as real-world rental branches users can understand and trust
 */

const locationData = {
    "New York": [
      "JFK Airport – Rental Car Center",
      "LaGuardia Airport – Rental Car Facility",
      "Newark Liberty Airport – Rental Car Center",
      "Manhattan Downtown – 99 Church St",
      "Manhattan Midtown – 305 W 42nd St",
      "Upper East Side – 124 E 84th St",
      "Brooklyn Downtown – 210 Livingston St",
      "Long Island City – 23-10 Jackson Ave"
    ],
  
    "Chicago": [
      "O'Hare Airport – Rental Car Center",
      "Midway Airport – Rental Car Facility",
      "Chicago Downtown – 181 W Madison St",
      "Chicago Loop – 230 S Clark St",
      "Lincoln Park – 2660 N Clark St",
      "Wrigleyville – 3700 N Halsted St"
    ],
  
    "Los Angeles": [
      "LAX Airport – Consolidated Rental Car Facility",
      "Burbank Airport – Rental Car Center",
      "Downtown Los Angeles – 444 S Flower St",
      "Hollywood – 6801 Hollywood Blvd",
      "Santa Monica – 1431 4th St",
      "Beverly Hills – 8800 Wilshire Blvd"
    ],
  
    "Houston": [
      "IAH Airport – Rental Car Center",
      "Hobby Airport – Rental Car Facility",
      "Downtown Houston – 1110 Louisiana St",
      "Galleria Area – 5015 Westheimer Rd",
      "Medical Center – 6550 Main St"
    ],
  
    "Seattle": [
      "SEA Airport – Rental Car Facility",
      "Downtown Seattle – 1919 5th Ave",
      "South Lake Union – 400 Dexter Ave N",
      "Capitol Hill – 110 Broadway E",
      "Bellevue Downtown – 500 108th Ave NE"
    ],
  
    "Boston": [
      "Logan Airport – Rental Car Center",
      "Downtown Boston – 270 Atlantic Ave",
      "Back Bay – 1 Dalton St",
      "Cambridge – 40 Mt Auburn St",
      "Seaport District – 51 Sleeper St"
    ],
  
    "Miami": [
      "Miami Airport – Rental Car Center",
      "Fort Lauderdale Airport – Rental Car Facility",
      "Downtown Miami – 50 SE 2nd Ave",
      "Brickell – 901 S Miami Ave",
      "South Beach – 1040 Collins Ave",
      "Wynwood – 2300 N Miami Ave"
    ],
  
    "Dallas": [
      "DFW Airport – Rental Car Center",
      "Dallas Love Field – Rental Car Facility",
      "Downtown Dallas – 1919 Jackson St",
      "Uptown – 2727 McKinney Ave",
      "Deep Ellum – 2600 Commerce St"
    ],
  
    "Denver": [
      "Denver Airport – Rental Car Center",
      "Downtown Denver – 1625 Broadway",
      "Union Station Area – 1777 Wewatta St",
      "Cherry Creek – 300 S Colorado Blvd",
      "Capitol Hill – 1200 E Colfax Ave"
    ],
  
    "San Francisco": [
      "SFO Airport – Rental Car Center",
      "Oakland Airport – Rental Car Facility",
      "Downtown San Francisco – 340 O'Farrell St",
      "Union Square – 441 Mason St",
      "SoMa – 780 Mission St",
      "Fisherman's Wharf – 350 Beach St"
    ],
  
    "Atlanta": [
      "ATL Airport – Rental Car Center",
      "Downtown Atlanta – 141 Courtland St NE",
      "Midtown – 75 14th St NE",
      "Buckhead – 3330 Piedmont Rd NE",
      "Virginia-Highland – 790 N Highland Ave"
    ]
  };
  
  /**
   * Get location options for a given city
   * @param {string} city
   * @returns {string[]}
   */
  export const getLocationsForCity = (city) => {
    if (!city) return [];
    return locationData[city] || [];
  };
  
  /**
   * Get all available cities
   * @returns {string[]}
   */
  export const getAvailableCities = () => {
    return Object.keys(locationData);
  };
  
  /**
   * Check if a city has location data
   * @param {string} city
   * @returns {boolean}
   */
  export const hasLocationData = (city) => {
    return Boolean(city && locationData[city]);
  };
  
  export default locationData;
  