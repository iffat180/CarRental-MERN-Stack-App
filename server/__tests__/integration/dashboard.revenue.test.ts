import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Request, Response } from "express";

import Car from "../../models/Car.js";
import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import { getDashboardData } from "../../controllers/ownerController.js";
import { errMessage } from "../../utils/errors.js";

let replSet: MongoMemoryReplSet | undefined;
let dbReady = false;

beforeAll(async () => {
  try {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri(), { dbName: "dashboard_test" });
    dbReady = true;
  } catch (err) {
    console.warn("[dashboard.revenue] skipping, no in-memory MongoDB:", errMessage(err));
  }
}, 120_000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

const callDashboard = async (owner: { _id: unknown; role: string }) => {
  let body: any;
  const res = {
    status: () => res,
    json: (b: unknown) => ((body = b), res),
  } as unknown as Response;
  await getDashboardData({ user: owner } as unknown as Request, res);
  return body;
};

const monthsAgo = (n: number): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 10));
};

describe("getDashboardData revenue by month", () => {
  const maybe = (name: string, fn: () => Promise<void>) =>
    it(name, async () => {
      if (!dbReady) return;
      await fn();
    });

  maybe("sums confirmed and completed bookings per pickup month, per owner", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "password123",
      role: "owner",
    });
    const other = await User.create({
      name: "Other",
      email: "other@test.com",
      password: "password123",
      role: "owner",
    });
    const car = await Car.create({
      owner: owner._id,
      brand: "Subaru",
      model: "Outback",
      image: "https://example.com/c.jpg",
      year: 2023,
      category: "SUV",
      seating_capacity: 5,
      fuel_type: "Petrol",
      transmission: "Automatic",
      pricePerDay: 95,
      location: "Denver",
      description: "test",
    });

    // Each row gets its own pickup day: a unique index forbids two active bookings of
    // one car with identical dates.
    let n = 0;
    const row = (status: string, price: number, months: number, who = owner._id) => {
      const pickupDate = new Date(monthsAgo(months).getTime() + n++ * 86400000);
      return {
        car: car._id,
        user: other._id,
        owner: who,
        status,
        price,
        pickupDate,
        returnDate: new Date(pickupDate.getTime() + 3 * 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    };

    // collection.insertMany skips the "pickup cannot be in the past" validator, which we need for history
    await Booking.collection.insertMany([
      row("confirmed", 300, 0),
      row("completed", 200, 0),
      row("pending", 999, 0), // pending does not count
      row("cancelled", 999, 0), // cancelled does not count
      row("completed", 150, 2),
      row("confirmed", 80, 8), // older than the 6-month window
      row("confirmed", 5000, 0, other._id), // someone else's booking
    ]);

    const { dashboardData } = await callDashboard({ _id: owner._id, role: "owner" });
    const months = dashboardData.revenueByMonth;

    expect(months).toHaveLength(6);
    expect(months[5]).toMatchObject({ revenue: 500, bookings: 2 }); // current month
    expect(months[3]).toMatchObject({ revenue: 150, bookings: 1 }); // two months ago
    expect(months[4].revenue).toBe(0);
    expect(months.reduce((a: number, m: { revenue: number }) => a + m.revenue, 0)).toBe(650);
    expect(dashboardData.monthlyRevenue).toBe(500);
  });
});
