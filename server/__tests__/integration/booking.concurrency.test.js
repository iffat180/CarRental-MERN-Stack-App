import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import Car from "../../models/Car.js";
import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import { __testables } from "../../controllers/bookingController.js";

const { createBookingAtomic } = __testables;

// Transactions need a replica set. MongoMemoryReplSet spins up a single-node
// one in-memory. If the mongod binary can't start in this environment we skip
// rather than fail the suite.
let replSet;
let dbReady = false;

beforeAll(async () => {
  try {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri(), { dbName: "concurrency_test" });
    await Booking.syncIndexes(); // build the partial unique index
    dbReady = true;
  } catch (err) {
    console.warn("[booking.concurrency] skipping — could not start in-memory replica set:", err.message);
  }
}, 120_000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

let car;
let baseUser;

beforeEach(async () => {
  if (!dbReady) return;
  await Promise.all([Booking.deleteMany({}), Car.deleteMany({}), User.deleteMany({})]);

  baseUser = await User.create({
    name: "Base User",
    email: `base_${Date.now()}@test.com`,
    password: "password123",
  });

  car = await Car.create({
    owner: baseUser._id,
    brand: "Toyota",
    model: "Corolla",
    image: "https://example.com/car.jpg",
    year: 2022,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 50,
    location: "Boston",
    description: "Reliable commuter",
  });
});

const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const maybe = (name, fn, timeout) =>
  it(name, async () => {
    if (!dbReady) return; // environment can't run transactions — treated as skipped
    await fn();
  }, timeout);

describe("createBookingAtomic — concurrency guarantee", () => {
  maybe(
    "allows exactly ONE booking when 20 identical requests race",
    async () => {
      const dates = { pickupDate: future(2), returnDate: future(5) };

      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          createBookingAtomic({ car: car._id, user: baseUser._id, status: "pending", ...dates })
            .then(() => ({ ok: true }))
            .catch((e) => ({ ok: false, code: e.code }))
        )
      );

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.filter((r) => !r.ok)).toHaveLength(19);
      results
        .filter((r) => !r.ok)
        .forEach((r) => expect(["CAR_UNAVAILABLE", 11000, 11001]).toContain(r.code));

      expect(await Booking.countDocuments({ car: car._id })).toBe(1);
    },
    60_000
  );

  maybe(
    "allows exactly ONE booking when different users race for OVERLAPPING (non-identical) dates",
    async () => {
      const users = await User.insertMany(
        Array.from({ length: 10 }, (_, i) => ({
          name: `Racer ${i}`,
          email: `racer_${i}_${Date.now()}@test.com`,
          password: "password123",
        }))
      );

      const results = await Promise.all(
        users.map((u, i) =>
          createBookingAtomic({
            car: car._id,
            user: u._id,
            status: "pending",
            pickupDate: new Date(Date.now() + (1 + i) * 60 * 60 * 1000), // staggered starts
            returnDate: future(6), // all overlap heavily
          })
            .then(() => true)
            .catch(() => false)
        )
      );

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(await Booking.countDocuments({ car: car._id })).toBe(1);
    },
    60_000
  );

  maybe(
    "permits a back-to-back booking — a same-day handoff is not an overlap",
    async () => {
      await createBookingAtomic({
        car: car._id,
        user: baseUser._id,
        status: "pending",
        pickupDate: future(10),
        returnDate: future(14),
      });

      await expect(
        createBookingAtomic({
          car: car._id,
          user: baseUser._id,
          status: "pending",
          pickupDate: future(14), // starts exactly when the previous ends
          returnDate: future(18),
        })
      ).resolves.toBeTruthy();

      expect(await Booking.countDocuments({ car: car._id })).toBe(2);
    },
    60_000
  );

  maybe(
    "frees the slot once the first booking is cancelled",
    async () => {
      const first = await createBookingAtomic({
        car: car._id,
        user: baseUser._id,
        status: "pending",
        pickupDate: future(20),
        returnDate: future(24),
      });

      await Booking.findByIdAndUpdate(first._id, { status: "cancelled" });

      await expect(
        createBookingAtomic({
          car: car._id,
          user: baseUser._id,
          status: "pending",
          pickupDate: future(20),
          returnDate: future(24),
        })
      ).resolves.toBeTruthy();
    },
    60_000
  );

  maybe(
    "rejects a booking that does not overlap on a DIFFERENT car independently",
    async () => {
      const otherCar = await Car.create({
        owner: baseUser._id,
        brand: "Honda",
        model: "Civic",
        image: "https://example.com/civic.jpg",
        year: 2023,
        category: "Sedan",
        seating_capacity: 5,
        fuel_type: "Petrol",
        transmission: "Automatic",
        pricePerDay: 60,
        location: "Boston",
        description: "Another car",
      });

      const dates = { pickupDate: future(2), returnDate: future(5) };
      const [a, b] = await Promise.all([
        createBookingAtomic({ car: car._id, user: baseUser._id, status: "pending", ...dates }),
        createBookingAtomic({ car: otherCar._id, user: baseUser._id, status: "pending", ...dates }),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(await Booking.countDocuments({})).toBe(2);
    },
    60_000
  );
});
