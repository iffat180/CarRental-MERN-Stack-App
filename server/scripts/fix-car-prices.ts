/**
 * One-off data fix: realistic daily prices for the cars that were relisted
 * under their real names (a RAV4 at $220 and an M5 at $95 looked wrong).
 * Only pricePerDay changes. Each car is found by brand + model.
 *
 * Dry run (default):  npx tsx scripts/fix-car-prices.ts
 * Apply:              npx tsx scripts/fix-car-prices.ts --apply
 * Then refresh search vectors:  npx tsx ai/seedCarVectors.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import Car from "../models/Car.js";

const PRICES: { brand: string; model: string; price: number }[] = [
  { brand: "Toyota", model: "RAV4", price: 85 },
  { brand: "Jeep", model: "Grand Cherokee", price: 105 },
  { brand: "Range Rover", model: "Evoque", price: 165 },
  { brand: "BMW", model: "3 Series Gran Turismo", price: 125 },
  { brand: "Audi", model: "A5 Sportback", price: 130 },
  { brand: "Mercedes-Benz", model: "A-Class", price: 90 },
  { brand: "BMW", model: "M5", price: 250 },
  { brand: "BMW", model: "M4", price: 210 },
  { brand: "Tesla", model: "Model 3", price: 105 },
  { brand: "Ford", model: "Focus", price: 55 },
  { brand: "Chevrolet", model: "Camaro", price: 120 },
];

const apply = process.argv.includes("--apply");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 8000 });
  console.log(apply ? "MODE: APPLY\n" : "MODE: DRY RUN\n");
  let problems = 0;
  for (const p of PRICES) {
    const found = await Car.find({ brand: p.brand, model: p.model });
    if (found.length !== 1) {
      console.log(`SKIP ${p.brand} ${p.model}: found ${found.length}`);
      problems++;
      continue;
    }
    console.log(`${p.brand} ${p.model} (${found[0].location}): $${found[0].pricePerDay} -> $${p.price}`);
    if (apply) await Car.updateOne({ _id: found[0]._id }, { $set: { pricePerDay: p.price } }, { runValidators: true });
  }
  console.log(apply ? `\nDone, ${problems} problem(s).` : `\nDry run, ${problems} problem(s).`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
