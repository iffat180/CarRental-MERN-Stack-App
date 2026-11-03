/**
 * One-off data fix: make 11 car listings match the photo they show.
 *
 * The first 11 seeded cars were given made-up brand+model pairs ("Nissan X5",
 * "Audi Civic", "Tesla Altima"...) while their photos show real, different cars.
 * This script corrects brand, model, category and specs, and rewrites the
 * description for the real car.
 *
 * It does NOT touch: owner, image, year, price, location, availability or any
 * booking. Each listing is found by its current brand + model AND its image
 * file name, so it can only ever change the exact record it was written for.
 *
 * Dry run (default, writes nothing):   npx tsx scripts/fix-car-listings.ts
 * Apply the changes:                   npx tsx scripts/fix-car-listings.ts --apply
 *
 * After applying, rebuild the AI search vectors:  npx tsx ai/seedCarVectors.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import Car from "../models/Car.js";

type Fix = {
  /** what the record looks like today (all three must match) */
  current: { brand: string; model: string; imageFile: string };
  /** what it should be */
  set: {
    brand: string;
    model: string;
    category: string;
    seating_capacity: number;
    fuel_type: string;
    transmission: string;
    mpg: number;
    trunk_capacity: number;
    tags: string[];
    description: string;
  };
};

const FIXES: Fix[] = [
  {
    current: { brand: "Nissan", model: "X5", imageFile: "car1.jpg" },
    set: {
      brand: "Toyota",
      model: "RAV4",
      category: "SUV",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 26,
      trunk_capacity: 1000,
      tags: ["SUV", "AWD", "Family", "Spacious", "Reliable", "Cargo", "Road Trip", "Practical"],
      description:
        "Reliable compact SUV with room for five and a generous cargo area, a dependable pick for family trips and weekend getaways. All-wheel-drive grip handles rain, snow and unpaved roads, while the high seating position and easy controls keep long drives relaxed. Fold the rear seats and it swallows luggage, camping gear or a big grocery run. Ideal for families wanting space and peace of mind, travelers heading into the mountains, or anyone who wants a no-fuss SUV that simply works.",
    },
  },
  {
    current: { brand: "Jeep", model: "Corolla", imageFile: "car2.jpg" },
    set: {
      brand: "Jeep",
      model: "Grand Cherokee",
      category: "SUV",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 22,
      trunk_capacity: 780,
      tags: ["SUV", "4WD", "Off-Road", "Family", "Adventure", "Towing", "Mountain", "Capable"],
      description:
        "Full-size SUV with real four-wheel-drive capability and a comfortable, quiet cabin for five. Built for mountain roads, snowy passes and gravel trails, yet smooth enough for long highway days. Plenty of space for luggage and gear, with strong towing ability if you need it. Ideal for families heading to the mountains, road trips that leave the pavement, or anyone who wants a confident, rugged SUV that still feels premium.",
    },
  },
  {
    current: { brand: "Range Rover", model: "Wrangler", imageFile: "car3.jpg" },
    set: {
      brand: "Range Rover",
      model: "Evoque",
      category: "SUV",
      seating_capacity: 4,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 24,
      trunk_capacity: 550,
      tags: ["SUV", "Luxury", "Stylish", "Compact", "Premium", "City", "AWD", "Design"],
      description:
        "Compact luxury SUV with a sculpted coupe-style roofline and a refined interior, made to turn heads in the city and on the coast road. All-wheel drive keeps it composed in wet weather, and the raised seating makes it easy to see and be seen. Seats four in comfort with room for weekend bags. Ideal for couples and small groups who want a stylish, upscale SUV for a city break, a special occasion or a scenic drive.",
    },
  },
  {
    current: { brand: "BMW", model: "Neo 6", imageFile: "car4.jpg" },
    set: {
      brand: "BMW",
      model: "3 Series Gran Turismo",
      category: "Hatchback",
      seating_capacity: 5,
      fuel_type: "Diesel",
      transmission: "Semi-Automatic",
      mpg: 28,
      trunk_capacity: 520,
      tags: [
        "Hatchback",
        "Luxury",
        "Performance",
        "Spacious",
        "Executive",
        "Highway",
        "Diesel",
        "Comfort",
      ],
      description:
        "Premium five-door hatchback with the driving feel of a BMW sedan and noticeably more rear-seat and luggage space. The efficient diesel engine is strong on highway miles, and the long wheelbase makes it comfortable on longer journeys. A large hatch opening swallows suitcases and bulky items. Ideal for business travelers, couples with luggage, or anyone who wants a sporty, upscale car that is also genuinely practical.",
    },
  },
  {
    current: { brand: "Audi", model: "Civic", imageFile: "car5.jpg" },
    set: {
      brand: "Audi",
      model: "A5 Sportback",
      category: "Hatchback",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 30,
      trunk_capacity: 480,
      tags: [
        "Hatchback",
        "Luxury",
        "Stylish",
        "Premium",
        "Business",
        "Highway",
        "Comfort",
        "Executive",
      ],
      description:
        "Elegant five-door coupe-style liftback with a polished interior and smooth, quiet performance. The low roofline looks sleek, while the hatch opens to a roomy 480 L boot for luggage. A calm, refined cabin makes motorway journeys effortless. Ideal for business trips, date nights and weekend getaways where you want to arrive in style without giving up practicality.",
    },
  },
  {
    current: { brand: "Mercedes", model: "Q5", imageFile: "car6.jpg" },
    set: {
      brand: "Mercedes-Benz",
      model: "A-Class",
      category: "Hatchback",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 36,
      trunk_capacity: 340,
      tags: [
        "Hatchback",
        "Compact",
        "Premium",
        "City",
        "Stylish",
        "Fuel-Efficient",
        "Tech",
        "Commute",
      ],
      description:
        "Compact premium hatchback with a high-quality interior, modern tech and an easy size for city driving. Light and agile through traffic, simple to park, and efficient enough to keep running costs low. Seats five for short trips, with a modest boot suited to a couple of bags. Ideal for city breaks, commuters who want a touch of luxury, and drivers who value style and efficiency over sheer space.",
    },
  },
  {
    current: { brand: "BMW", model: "Elantra", imageFile: "car7.png" },
    set: {
      brand: "BMW",
      model: "M5",
      category: "Sedan",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 20,
      trunk_capacity: 530,
      tags: ["Sedan", "Performance", "Luxury", "Sport", "Fast", "Executive", "V8", "Statement"],
      description:
        "High-performance executive sedan that pairs supercar-level speed with a spacious, comfortable cabin for five. Thrilling acceleration, sharp handling and a deep exhaust note on the open road, yet calm and refined in everyday traffic. A full-size boot handles luggage with ease. Ideal for car enthusiasts, special occasions and anyone who wants a fast, luxurious sedan for a memorable drive.",
    },
  },
  {
    current: { brand: "BMW", model: "Sportage", imageFile: "car8.png" },
    set: {
      brand: "BMW",
      model: "M4",
      category: "Coupe",
      seating_capacity: 4,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 21,
      trunk_capacity: 445,
      tags: ["Coupe", "Sport", "Performance", "Fun", "Weekend", "Stylish", "Fast", "Driver"],
      description:
        "Two-door performance coupe built for the pleasure of driving. Powerful turbocharged engine, precise steering and a low, planted stance make winding roads a joy. Seats four, with a boot big enough for a weekend away. Ideal for enthusiasts, couples on a scenic getaway, photo-worthy road trips and anyone who wants a car that feels special every time they turn the key.",
    },
  },
  {
    current: { brand: "Tesla", model: "Altima", imageFile: "car9.png" },
    set: {
      brand: "Tesla",
      model: "Model 3",
      category: "Sedan",
      seating_capacity: 5,
      fuel_type: "Electric",
      transmission: "Automatic",
      mpg: 130,
      trunk_capacity: 425,
      tags: ["Electric", "Sedan", "Tech", "Eco", "Modern", "Zero-Emission", "Fast", "Commute"],
      description:
        "All-electric sedan with instant acceleration, a minimalist touchscreen cabin and zero tailpipe emissions. Quiet and smooth on city streets and highways, with low running costs and a wide network of fast chargers for longer trips. Seats five with a practical trunk. Ideal for eco-conscious drivers, tech enthusiasts, daily commuters and anyone curious to try an electric car. (MPG shown is MPGe, the electric equivalent.)",
    },
  },
  {
    current: { brand: "Ford", model: "Model 3", imageFile: "car10.jpg" },
    set: {
      brand: "Ford",
      model: "Focus",
      category: "Hatchback",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 32,
      trunk_capacity: 375,
      tags: [
        "Hatchback",
        "Compact",
        "City",
        "Fuel-Efficient",
        "Commute",
        "Practical",
        "Reliable",
        "Easy",
      ],
      description:
        "Easy-to-drive compact hatchback that is nimble in the city and comfortable on the highway. Light steering, good visibility and a small footprint make parking simple, while good fuel economy keeps costs down. Seats five, with a flexible hatch for bags and shopping. Ideal for daily commutes, city breaks, short trips and anyone who wants a dependable, no-surprises car.",
    },
  },
  {
    current: { brand: "Chevrolet", model: "CX-5", imageFile: "car11.png" },
    set: {
      brand: "Chevrolet",
      model: "Camaro",
      category: "Coupe",
      seating_capacity: 4,
      fuel_type: "Petrol",
      transmission: "Automatic",
      mpg: 22,
      trunk_capacity: 258,
      tags: ["Coupe", "Sport", "Muscle", "Fun", "Weekend", "Fast", "Statement", "Performance"],
      description:
        "American muscle coupe with a powerful V8 soundtrack, aggressive styling and real straight-line speed. A low, wide stance and responsive handling make it as fun on a canyon road as on an open highway. Seats four with a compact trunk, so pack light. Ideal for weekend getaways, special occasions and anyone who wants a loud, fast, head-turning car for a day or two.",
    },
  },
];

// Not a mismatch, just a wrong number: the EV9 is electric but listed at 28 mpg.
const EV9_FIX = { match: { brand: "KIA", model: "EV9" }, set: { mpg: 80 } };

const apply = process.argv.includes("--apply");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(
    apply ? "MODE: APPLY (writing to the database)\n" : "MODE: DRY RUN (nothing will be written)\n"
  );

  let problems = 0;
  let changed = 0;

  for (const fix of FIXES) {
    const { brand, model, imageFile } = fix.current;
    const matches = await Car.find({
      brand,
      model,
      image: { $regex: `/${imageFile.replace(".", "\\.")}$` },
    });
    if (matches.length !== 1) {
      console.log(
        `SKIP  ${brand} ${model} (${imageFile}): expected exactly 1 match, found ${matches.length}`
      );
      problems++;
      continue;
    }
    const doc = matches[0];
    console.log(`${brand} ${model}  ->  ${fix.set.brand} ${fix.set.model}   [${doc._id}]`);
    for (const [key, value] of Object.entries(fix.set)) {
      if (key === "description" || key === "tags") continue;
      const before = (doc as any)[key];
      if (before !== value) console.log(`   ${key}: ${before} -> ${value}`);
    }
    console.log(`   tags: [${(doc.tags || []).join(", ")}] -> [${fix.set.tags.join(", ")}]`);
    console.log(
      `   description: rewritten (${doc.description.length} -> ${fix.set.description.length} chars)\n`
    );

    if (apply) {
      await Car.updateOne({ _id: doc._id }, { $set: fix.set }, { runValidators: true });
      changed++;
    }
  }

  const ev9 = await Car.find(EV9_FIX.match);
  if (ev9.length === 1) {
    console.log(
      `KIA EV9  [${ev9[0]._id}]\n   mpg: ${ev9[0].mpg} -> ${EV9_FIX.set.mpg}  (MPGe, it is electric)\n`
    );
    if (apply) {
      await Car.updateOne({ _id: ev9[0]._id }, { $set: EV9_FIX.set }, { runValidators: true });
      changed++;
    }
  } else {
    console.log(`SKIP  KIA EV9: expected exactly 1 match, found ${ev9.length}`);
    problems++;
  }

  console.log(
    apply
      ? `Done. Updated ${changed} listings, ${problems} problem(s).`
      : `Dry run finished: ${problems} problem(s). Re-run with --apply to write.`
  );
  await mongoose.disconnect();
  if (problems) process.exitCode = 1;
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
