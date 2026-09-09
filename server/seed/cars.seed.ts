// import "dotenv/config";
// import mongoose from "mongoose";
// import bcrypt from "bcrypt";
// import User from "../models/User.js";
// import Car from "../models/Car.js";

// // Environment variable configuration
// const PLATFORM_EMAIL = process.env.SEED_PLATFORM_EMAIL || "fleet@platform.com";
// const PLATFORM_PASSWORD = process.env.SEED_PLATFORM_PASSWORD || "PlatformFleet2024!";
// const PLATFORM_NAME = process.env.SEED_PLATFORM_NAME || "Platform Fleet";

// // Check if cleanup mode is enabled
// const CLEANUP_MODE = process.argv.includes('--cleanup') || process.env.SEED_CLEANUP === 'true';

// // All 18 images
// const IMAGES = [
//   "/uploads/car1.jpg",
//   "/uploads/car2.jpg",
//   "/uploads/car3.jpg",
//   "/uploads/car4.jpg",
//   "/uploads/car5.jpg",
//   "/uploads/car6.jpg",
//   "/uploads/car7.jpg",
//   "/uploads/car8.jpg",
//   "/uploads/car9.jpg",
//   "/uploads/car10.jpg",
//   "/uploads/car11.jpg",
//   "/uploads/car12.jpg",
//   "/uploads/car13.jpg", // Toyota Prius
//   "/uploads/car14.jpg", // Mazda MX-5 Miata
//   "/uploads/car15.jpg", // Mercedes-Benz E-Class
//   "/uploads/car16.jpg", // Dodge Grand Caravan
//   "/uploads/car17.jpg", // Subaru Outback
//   "/uploads/car18.jpg", // Ford F-150
// ];

// const makeCars = (ownerId) => [
//   // ========================================
//   // ORIGINAL 11 CARS - UPDATED WITH RICH DESCRIPTIONS & 8 TAGS
//   // ========================================

//   // CAR 1 - Nissan X5 (Luxury SUV)
//   {
//     owner: ownerId,
//     brand: "Nissan",
//     model: "X5",
//     year: 2022,
//     category: "SUV",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 220,
//     location: "New York",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car1.jpg",
//     mpg: 24,
//     trunk_capacity: 650,
//     tags: ["SUV", "Luxury", "Spacious", "Family", "Premium", "Cargo", "Comfortable", "City"],
//     description: "Luxury midsize SUV combining elegant design with versatile practicality for urban professionals and families. Premium interior with advanced technology creates upscale driving environment perfect for client meetings and family outings. Spacious cabin comfortably seats 5 adults with generous legroom. Large cargo area handles family vacations, shopping trips, or business travel with multiple suitcases. Smooth ride quality makes long trips comfortable while premium features impress passengers. Ideal for families needing space and comfort, business travelers wanting professional appearance, weekend getaways requiring cargo capacity, or anyone seeking luxury SUV experience in America's busiest city. Perfect blend of sophistication and utility.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 2 - Jeep Corolla (Reliable Commuter)
//   {
//     owner: ownerId,
//     brand: "Jeep",
//     model: "Corolla",
//     year: 2021,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Diesel",
//     transmission: "Manual",
//     pricePerDay: 130,
//     location: "Chicago",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car2.jpg",
//     mpg: 32,
//     trunk_capacity: 370,
//     tags: ["Sedan", "Reliable", "Fuel-Efficient", "Compact", "Commute", "Budget", "City", "Manual"],
//     description: "Reliable compact sedan perfect for daily driving and city life with impressive diesel fuel economy. Manual transmission provides engaging driving experience and maximum fuel efficiency of 32 MPG. Compact size makes parking in tight Chicago streets effortless while still offering comfortable seating for 5 passengers. Proven reliability means worry-free transportation for work commutes, errands, and weekend trips. Ideal for office commuters wanting to save on gas, driving enthusiasts who enjoy manual gearbox, city dwellers navigating urban congestion, or anyone seeking practical no-nonsense vehicle that's affordable to rent and operate. Simple controls and easy maintenance make it perfect temporary car.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 3 - Range Rover Wrangler (Adventure Hybrid)
//   {
//     owner: ownerId,
//     brand: "Range Rover",
//     model: "Wrangler",
//     year: 2023,
//     category: "SUV",
//     seating_capacity: 4,
//     fuel_type: "Hybrid",
//     transmission: "Automatic",
//     pricePerDay: 200,
//     location: "Los Angeles",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car3.jpg",
//     mpg: 22,
//     trunk_capacity: 880,
//     tags: ["SUV", "Off-Road", "Adventure", "Hybrid", "Rugged", "Outdoor", "Convertible", "Beach"],
//     description: "Iconic off-road SUV with hybrid efficiency, built for California adventures from mountains to beaches. Removable doors and roof create open-air driving experience perfect for Pacific Coast Highway cruises and desert exploration. Advanced hybrid powertrain balances off-road capability with improved fuel economy for long adventure journeys. Serious 4WD system tackles Angeles National Forest trails, Joshua Tree rocks, and Malibu beach sand. Ideal for outdoor enthusiasts exploring California's diverse terrain, beach trips wanting convertible-like experience with more capability, weekend warriors seeking adventure vehicle, or anyone wanting distinctive SUV with personality. Not your boring daily driver.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 4 - BMW Neo 6 (Sport Luxury Sedan)
//   {
//     owner: ownerId,
//     brand: "BMW",
//     model: "Neo 6",
//     year: 2022,
//     category: "Sedan",
//     seating_capacity: 4,
//     fuel_type: "Diesel",
//     transmission: "Semi-Automatic",
//     pricePerDay: 150,
//     location: "Houston",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car4.jpg",
//     mpg: 28,
//     trunk_capacity: 480,
//     tags: ["Sedan", "Luxury", "Performance", "Sport", "Executive", "Premium", "Business", "Diesel"],
//     description: "Premium German sport sedan offering perfect balance of luxury comfort and dynamic performance for Houston professionals. Powerful diesel engine delivers strong acceleration and excellent highway fuel economy for Texas road trips. Semi-automatic transmission provides sporty paddle-shift control when desired. Sophisticated interior with high-quality materials creates executive environment for business travel. Advanced technology and driver assistance features make every journey effortless. Ideal for business professionals needing to impress clients, executives wanting premium driving experience that's engaging, special occasions requiring upscale transportation, or car enthusiasts appreciating German engineering excellence. Luxury sedan with sporting spirit.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 5 - Audi Civic (Practical Commuter)
//   {
//     owner: ownerId,
//     brand: "Audi",
//     model: "Civic",
//     year: 2020,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 120,
//     location: "Seattle",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car5.jpg",
//     mpg: 33,
//     trunk_capacity: 420,
//     tags: ["Sedan", "Compact", "Reliable", "Fuel-Efficient", "City", "Commute", "Practical", "Affordable"],
//     description: "Practical compact sedan offering excellent value for Seattle's daily driving needs with outstanding 33 MPG fuel economy. Spacious interior for its size comfortably accommodates 5 passengers with surprising room for tech workers carpooling to campus. Efficient automatic transmission makes stop-and-go traffic less stressful. Reliable reputation means minimal maintenance worries during rental period. Ideal for daily office commutes to Amazon or Microsoft campuses, temporary car while yours is serviced, budget-conscious travelers exploring Pacific Northwest, or anyone needing affordable reliable transportation. Handles Seattle's hills and rain with confidence. Simple, efficient, and gets the job done without drama.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 6 - Mercedes Q5 (Premium Family SUV)
//   {
//     owner: ownerId,
//     brand: "Mercedes",
//     model: "Q5",
//     year: 2021,
//     category: "SUV",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 210,
//     location: "Boston",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car6.jpg",
//     mpg: 25,
//     trunk_capacity: 750,
//     tags: ["SUV", "Luxury", "Premium", "Spacious", "Family", "Elegant", "AWD", "Sophisticated"],
//     description: "Luxury compact SUV blending sophisticated European styling with practical New England versatility. Premium interior crafted with fine materials creates upscale environment for Boston professionals and families. All-wheel drive system provides confident handling through Massachusetts winters and coastal weather. Generous cargo space handles family luggage for Cape Cod weekends, shopping trips to Newbury Street, or business travel equipment. Refined ride quality and quiet cabin make commutes through Boston traffic pleasant. Ideal for families wanting luxury without massive size, business travelers needing professional appearance with practicality, weekend getaways to Vermont or Maine, or anyone seeking premium SUV experience. Elegance meets utility.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 7 - BMW Elantra (Budget Sedan)
//   {
//     owner: ownerId,
//     brand: "BMW",
//     model: "Elantra",
//     year: 2019,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 95,
//     location: "Miami",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car7.png",
//     mpg: 35,
//     trunk_capacity: 400,
//     tags: ["Sedan", "Budget", "Fuel-Efficient", "Compact", "Reliable", "City", "Beach", "Affordable"],
//     description: "Budget-friendly sedan delivering impressive value and exceptional 35 MPG fuel economy for Miami adventures. Modern styling and comfortable interior defy its affordable $95 daily rate. Excellent fuel efficiency perfect for exploring Florida Keys or driving to Orlando theme parks without breaking bank. Reliable performance makes it worry-free transportation for beach days, South Beach nightlife, or Everglades exploration. Ideal for budget travelers maximizing vacation dollars, spring breakers needing affordable wheels, students or young professionals, or anyone seeking basic transportation that's still comfortable and efficient. At under $100 per day, it's smart economical choice for practical people who'd rather spend money on experiences.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 8 - BMW Sportage (Family Compact SUV)
//   {
//     owner: ownerId,
//     brand: "BMW",
//     model: "Sportage",
//     year: 2022,
//     category: "SUV",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 140,
//     location: "Dallas",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car8.png",
//     mpg: 27,
//     trunk_capacity: 740,
//     tags: ["SUV", "Compact", "Family", "Spacious", "Reliable", "Practical", "Versatile", "City"],
//     description: "Versatile compact SUV perfect for Dallas families and active Texas lifestyles. Spacious interior comfortably seats 5 with plenty of headroom and legroom for all passengers during road trips to Austin or San Antonio. Generous cargo area swallows Costco runs, sports equipment for youth leagues, weekend luggage, or tailgating gear for Cowboys games. Good fuel economy of 27 MPG makes it economical for daily use and highway drives. Reliable reputation means worry-free transportation. Ideal for small families needing space without huge SUV size and fuel costs, active individuals transporting sports gear and equipment, weekend warriors loading up for Hill Country adventures, or anyone wanting SUV versatility at reasonable price. Practical choice handling real Texas life.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 9 - Tesla Altima (Comfortable Midsize)
//   {
//     owner: ownerId,
//     brand: "Tesla",
//     model: "Altima",
//     year: 2021,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 110,
//     location: "Denver",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car9.png",
//     mpg: 30,
//     trunk_capacity: 440,
//     tags: ["Sedan", "Comfortable", "Spacious", "Family", "Reliable", "Midsize", "Practical", "Highway"],
//     description: "Comfortable midsize sedan offering spacious cabin and smooth ride quality perfect for Colorado road trips and mountain drives. Roomy interior provides adult-friendly space in both front and back seats for comfortable journeys to ski resorts or mountain towns. Large trunk easily accommodates luggage for week-long Rocky Mountain adventures or business travel. Refined ride quality absorbs Colorado's variable road conditions making highway drives relaxing. Good 30 MPG fuel economy handles elevation changes efficiently. Ideal for family road trips to Vail or Aspen prioritizing comfort, business travel requiring spacious professional sedan, groups of friends heading to Red Rocks concerts, or anyone seeking relaxed driving experience. Solid, dependable transportation for mile-high adventures.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 10 - Ford Model 3 (Electric Sedan)
//   {
//     owner: ownerId,
//     brand: "Ford",
//     model: "Model 3",
//     year: 2023,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Electric",
//     transmission: "Automatic",
//     pricePerDay: 180,
//     location: "San Francisco",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car10.jpg",
//     mpg: 130, // Electric equivalent (MPGe)
//     trunk_capacity: 425,
//     tags: ["Electric", "Sedan", "Tech", "Eco", "Modern", "Zero-Emission", "Fast", "Innovation"],
//     description: "All-electric sedan combining zero emissions with impressive performance and cutting-edge technology perfect for eco-conscious San Francisco. Electric powertrain delivers instant acceleration and smooth, silent operation through Bay Area hills. Minimalist interior dominated by large touchscreen puts all controls at fingertips. Zero gas costs mean substantial savings for extended rentals or multi-day Silicon Valley business trips. Extensive charging infrastructure throughout Bay Area makes range anxiety minimal. Ideal for eco-conscious drivers wanting to reduce environmental impact, tech enthusiasts appreciating latest automotive innovation, professionals visiting tech companies who appreciate sustainable transportation, or anyone curious about electric vehicle experience. Experience the future of driving with zero tailpipe emissions in America's greenest city.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 11 - Chevrolet CX-5 (Sporty Compact SUV)
//   {
//     owner: ownerId,
//     brand: "Chevrolet",
//     model: "CX-5",
//     year: 2020,
//     category: "SUV",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 135,
//     location: "Atlanta",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car11.png",
//     mpg: 28,
//     trunk_capacity: 680,
//     tags: ["SUV", "Compact", "Stylish", "Sporty", "Family", "Fun", "Reliable", "Modern"],
//     description: "Sporty compact SUV standing out with upscale design and engaging driving dynamics perfect for Atlanta's diverse needs. Athletic styling turns heads cruising through Buckhead or Midtown while practical SUV versatility handles everything from airport runs to weekend getaways. Refined interior feels more premium than price suggests with quality materials and thoughtful design. Fun-to-drive character with responsive handling makes it enjoyable for enthusiasts while remaining family-friendly and practical. Good 28 MPG fuel economy handles Atlanta traffic and highway trips efficiently. Ideal for small families wanting style beyond basic transportation, young professionals wanting something distinctive and modern, driving enthusiasts seeking SUV that's actually enjoyable, or anyone seeking compact SUV with personality. Smart choice for daily use and southern adventures.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 12 - KIA Sportage (Family Compact SUV)
//   {
//     owner: ownerId,
//     brand: "KIA",
//     model: "EV9",
//     year: 2024,
//     category: "SUV",
//     seating_capacity: 7,
//     fuel_type: "Electric",
//     transmission: "Automatic",
//     pricePerDay: 135,
//     location: "Chicago",
//     description: "Family-friendly 7-passenger seating electric SUV with spacious interior and advanced technology perfect for Chicago winters. Advanced electric powertrain delivers instant acceleration and smooth, silent operation through Chicago's cold weather. Minimalist interior dominated by large touchscreen puts all controls at fingertips. Zero gas costs mean substantial savings for extended rentals or multi-day Chicago business trips. Extensive charging infrastructure throughout Chicago makes range anxiety minimal. Ideal for eco-conscious drivers wanting to reduce environmental impact, tech enthusiasts appreciating latest automotive innovation, professionals visiting Chicago companies who appreciate sustainable transportation, or anyone curious about electric vehicle experience. Experience the future of driving with zero tailpipe emissions in America's windy city.",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car12_XuVhzJ8IT.jpg",
//     mpg: 28,
//     trunk_capacity: 680,
//     tags: ["SUV", "7-Seater", "Stylish", "Sporty", "Family", "Fun", "Reliable", "Modern"],
//   },

//   // ========================================
//   // NEW 6 CARS WITH RICH DESCRIPTIONS & 8 TAGS
//   // ========================================

//   // CAR 13 - Toyota Prius (Eco Commuter Champion)
//   {
//     owner: ownerId,
//     brand: "Toyota",
//     model: "Prius",
//     year: 2022,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Hybrid",
//     transmission: "Automatic",
//     pricePerDay: 55,
//     location: "San Francisco",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car13.jpg",
//     mpg: 54,
//     trunk_capacity: 425,
//     tags: ["Hybrid", "Eco", "Commute", "Budget", "Fuel-Efficient", "City", "Reliable", "Green"],
//     description: "Industry-leading hybrid sedan with exceptional 54 MPG fuel economy, perfect for eco-conscious drivers and budget-minded daily commuters. Ultra-low running costs save money on every mile, making it ideal for office commutes, city errands, and environmentally responsible transportation. Spacious interior comfortably seats 5 with surprisingly roomy trunk for groceries and work supplies. Advanced hybrid system means you'll spend minimal time at gas stations while reducing your carbon footprint. Reliable Toyota engineering ensures worry-free daily driving. Perfect for green transportation needs, temporary car while yours is in the shop, or extended business travel where fuel costs matter. Quiet cabin and smooth ride make even long commutes comfortable and stress-free.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 14 - Mazda MX-5 Miata (Weekend Fun Roadster)
//   {
//     owner: ownerId,
//     brand: "Mazda",
//     model: "MX-5 Miata",
//     year: 2023,
//     category: "Convertible",
//     seating_capacity: 2,
//     fuel_type: "Petrol",
//     transmission: "Manual",
//     pricePerDay: 95,
//     location: "Los Angeles",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car14.jpg",
//     mpg: 30,
//     trunk_capacity: 130,
//     tags: ["Convertible", "Sport", "Fun", "Weekend", "Romantic", "Stylish", "Coastal", "Photogenic"],
//     description: "Legendary lightweight roadster that puts pure driving joy first. Drop the top and feel the wind on scenic coastal drives, winding mountain roads, or romantic sunset cruises. Perfectly balanced handling makes every corner thrilling while remaining affordable and practical for weekend adventures. Compact size navigates tight beach town streets effortlessly while turning heads everywhere you go. Ideal for date nights where you want to impress, weekend getaways to wine country or coastal destinations, photo shoots requiring iconic sports car aesthetic, or simply treating yourself to driving pleasure. Manual transmission engages you with the road for authentic sports car experience. Small trunk carries weekend bags for two. Not practical for daily duties, but unmatched for creating memorable experiences and feeling alive behind the wheel.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 15 - Mercedes-Benz E-Class (Executive Luxury)
//   {
//     owner: ownerId,
//     brand: "Mercedes-Benz",
//     model: "E-Class",
//     year: 2023,
//     category: "Sedan",
//     seating_capacity: 5,
//     fuel_type: "Hybrid",
//     transmission: "Automatic",
//     pricePerDay: 180,
//     location: "New York",
//       image: "https://ik.imagekit.io/i2pla7jv7/cars/car15.jpg",
//     mpg: 32,
//     trunk_capacity: 540,
//     tags: ["Luxury", "Executive", "Premium", "Business", "Elegant", "Sophisticated", "Hybrid", "Prestige"],
//     description: "Quintessential luxury sedan representing German engineering excellence and refined elegance. Whisper-quiet cabin wrapped in premium leather creates executive environment perfect for important meetings or formal events. Advanced hybrid powertrain delivers surprising fuel economy without sacrificing smooth, powerful performance. Cutting-edge technology includes gesture controls, premium sound system, and ambient lighting that adjusts to your mood. Ideal for business travelers needing to arrive at client meetings with professional impression, wedding parties requiring elegant transportation that photographs beautifully, formal events like galas where appearance matters, or house hunting days where comfort during all-day property viewings is essential. Back seat offers executive-level space for clients or family members. This is transportation that makes a statement of success and sophistication.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 16 - Dodge Grand Caravan (Family Van Hero)
//   {
//     owner: ownerId,
//     brand: "Dodge",
//     model: "Grand Caravan",
//     year: 2023,
//     category: "Van",
//     seating_capacity: 7,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 85,
//     location: "Chicago",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car16.jpg",
//     mpg: 25,
//     trunk_capacity: 950,
//     tags: ["7-Seater", "Family", "Group", "Cargo", "Spacious", "Practical", "Accessible", "Van"],
//     description: "Ultimate family minivan with 7 comfortable seats and massive cargo space for luggage, camping gear, or moving supplies. Stow 'n Go seating system allows rows to fold flat into floor, creating enormous cargo area perfect for furniture transport or bulky items. Sliding doors provide easy entry for kids, elderly passengers, or tight parking spaces. Multiple cup holders, storage compartments, and entertainment options keep everyone happy on long road trips. Low loading height and wide door openings make wheelchair or walker access simple for medical appointments. Ideal for multi-generational family vacations with grandparents and grandkids, group trips with friends to concerts or sporting events, moving apartments with maximum hauling capacity, or transporting elderly relatives with accessibility needs. Practical, spacious, and built for real life.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 17 - Subaru Outback (Adventure Wagon)
//   {
//     owner: ownerId,
//     brand: "Subaru",
//     model: "Outback",
//     year: 2023,
//     category: "SUV",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 95,
//     location: "Denver",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car17.jpg",
//     mpg: 29,
//     trunk_capacity: 850,
//     tags: ["AWD", "Adventure", "Family", "Camping", "Reliable", "All-Weather", "Versatile", "Practical"],
//     description: "Perfect blend of SUV capability and wagon practicality, built for active lifestyles and outdoor adventures. Legendary Subaru all-wheel drive provides confidence in rain, snow, or light trails while maintaining excellent fuel economy for daily use. Ground clearance handles unpaved roads and camping sites with ease. Massive cargo area swallows camping gear, bikes, kayaks, or week's worth of family luggage without roof cargo. Reliable reputation means worry-free road trips to remote destinations. Ideal for families who actually use their vehicle for adventures, camping trips requiring both comfort and capability, mountain drives in changing weather conditions, or national park explorations where reliability matters. Practical enough for grocery runs yet capable enough for weekend wilderness escapes. Not flashy or luxurious, but genuinely useful for people who go places.",
//     isAvailable: true,
//     source: "seed",
//   },

//   // CAR 18 - Ford F-150 (Utility Powerhouse)
//   {
//     owner: ownerId,
//     brand: "Ford",
//     model: "F-150",
//     year: 2023,
//     category: "Truck",
//     seating_capacity: 5,
//     fuel_type: "Petrol",
//     transmission: "Automatic",
//     pricePerDay: 110,
//     location: "Houston",
//     image: "https://ik.imagekit.io/i2pla7jv7/cars/car18.jpg",
//     mpg: 22,
//     trunk_capacity: 1500,
//     tags: ["Truck", "Cargo", "Towing", "Off-Road", "Utility", "Camping", "Hauling", "Rugged"],
//     description: "America's best-selling truck combines legendary capability with modern comfort. Massive 6.5-foot bed hauls furniture from IKEA, camping gear for week-long adventures, or supplies for DIY projects with ease. 4WD system tackles muddy trails, snowy mountain passes, and rugged terrain where SUVs fear to tread. Towing capacity handles boat trailers, campers, or moving trailers effortlessly. Spacious crew cab seats 5 adults comfortably with surprising luxury features and quiet ride. Perfect for moving apartments with bed space for mattresses and furniture, camping expeditions requiring serious gear capacity, tailgating at sports events with built-in party platform, or outdoor adventures needing true off-road capability. When you need to actually haul, tow, or tackle serious terrain, nothing else will do.",
//     isAvailable: true,
//     source: "seed",
//   },
// ];

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("✅ MongoDB connected");

//     // Make or reuse a special owner for preloaded cars
//     const platformEmail = PLATFORM_EMAIL;
//     const hashedPassword = await bcrypt.hash(PLATFORM_PASSWORD, 10);

//     const platformUser = await User.findOneAndUpdate(
//       { email: platformEmail },
//       {
//         name: PLATFORM_NAME,
//         email: platformEmail,
//         role: "owner",
//         password: hashedPassword,
//       },
//       { new: true, upsert: true }
//     );
//     console.log("✅ Platform user:", platformUser._id.toString());

//     // Check if seed cars already exist
//     const existingSeedCars = await Car.countDocuments({ source: "seed" });
//     console.log(`📊 Found ${existingSeedCars} existing seed cars`);

//     // If cleanup mode is enabled, delete existing seed cars
//     if (CLEANUP_MODE) {
//       if (existingSeedCars > 0) {
//         const deleted = await Car.deleteMany({ source: "seed" });
//         console.log(`🗑️  Deleted ${deleted.deletedCount} existing seed cars`);
//       } else {
//         console.log("ℹ️  No seed cars to clean up.");
//       }
      
//       // After cleanup, proceed to seed new cars
//       console.log("🚀 Proceeding with seeding...");
//     } else if (existingSeedCars > 0) {
//       // If not in cleanup mode and cars exist, warn and exit
//       console.log(`⚠️  Seed cars already exist (${existingSeedCars} cars).`);
//       console.log("❌ To avoid duplicates, please run with --cleanup flag:");
//       console.log("   node seed/cars.seed.js --cleanup");
//       await mongoose.disconnect();
//       process.exit(1);
//     }

//     // Insert all 17 cars (11 updated + 6 new)
//     const cars = makeCars(platformUser._id);
//     await Car.insertMany(cars);
//     console.log(`✅ Seeded ${cars.length} cars`);

//     await mongoose.disconnect();
//     console.log("✅ Disconnected from MongoDB");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Seed failed:", {
//       message: error.message,
//       name: error.name,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//       timestamp: new Date().toISOString()
//     });
//     await mongoose.disconnect().catch(() => {});
//     process.exit(1);
//   }
// })();