/**
 * One-time migration for the double-booking fix.
 *
 * Run once against each environment (local, staging, Atlas) after deploying the
 * new Booking model:
 *
 *   MONGODB_URI="<uri>" node scripts/sync-booking-indexes.js
 *
 * What it does:
 *   1. Reports any car that already has two or more overlapping ACTIVE bookings
 *      (data that violates the new invariant and must be resolved by hand).
 *   2. Runs Booking.syncIndexes() — drops the obsolete
 *      { user, car, pickupDate, returnDate } unique index and builds the new
 *      partial unique index { car, pickupDate, returnDate }.
 */
import "dotenv/config";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

const ACTIVE = ["pending", "confirmed"];

const findOverlaps = async () => {
  const bookings = await Booking.find({ status: { $in: ACTIVE } })
    .select("car pickupDate returnDate status user")
    .sort({ car: 1, pickupDate: 1 })
    .lean();

  const byCar = new Map();
  for (const b of bookings) {
    const key = String(b.car);
    if (!byCar.has(key)) byCar.set(key, []);
    byCar.get(key).push(b);
  }

  const conflicts = [];
  for (const [car, list] of byCar) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.pickupDate < b.returnDate && a.returnDate > b.pickupDate) {
          conflicts.push({ car, a: a._id, b: b._id });
        }
      }
    }
  }
  return conflicts;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const conflicts = await findOverlaps();
  if (conflicts.length) {
    console.warn(`\n⚠️  ${conflicts.length} pre-existing overlapping active booking pair(s):`);
    conflicts.forEach((c) => console.warn(`   car ${c.car}: booking ${c.a} <-> ${c.b}`));
    console.warn(
      "\nThe partial unique index only blocks EXACT date-range duplicates, so it will still\n" +
      "build — but resolve these (cancel one of each pair) so the data matches the invariant.\n"
    );
  } else {
    console.log("No pre-existing overlaps. 👍");
  }

  console.log("\nSyncing Booking indexes...");
  const dropped = await Booking.syncIndexes();
  console.log("Done. Dropped indexes:", dropped);
  console.log("Current indexes:", Object.keys(await Booking.collection.indexInformation()));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
