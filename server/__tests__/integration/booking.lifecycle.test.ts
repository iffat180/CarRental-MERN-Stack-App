import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../../app.js";
import Car from "../../models/Car.js";
import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import { errMessage } from "../../utils/errors.js";

// A whole booking journey through the real routes and a real (in-memory) database:
// sign up, log in, book, look at the booking, cancel it, and what each person is
// and is not allowed to do. Skips, like the other integration tests, if the
// in-memory database cannot start here.
let replSet: MongoMemoryReplSet | undefined;
let dbReady = false;

const day = 24 * 60 * 60 * 1000;
const dates = (from: number, to: number) => ({
  pickupDate: new Date(Date.now() + from * day).toISOString(),
  returnDate: new Date(Date.now() + to * day).toISOString(),
});
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

let renterToken: string;
let otherToken: string;
let ownerToken: string;
let carId: string;

beforeAll(async () => {
  process.env.JWT_SECRET ??= "test-secret";
  try {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri(), { dbName: "lifecycle_test" });
    await Booking.syncIndexes();
    dbReady = true;
  } catch (err) {
    console.warn("[booking.lifecycle] skipping, no in-memory database:", errMessage(err));
    return;
  }

  const owner = await User.create({
    name: "Olivia Owner",
    email: "owner@test.com",
    password: "password123",
    role: "owner",
  });
  ownerToken = jwt.sign({ userId: owner._id.toString(), role: "owner" }, process.env.JWT_SECRET!);
  const car = await Car.create({
    owner: owner._id,
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
  carId = car._id.toString();
}, 120_000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

const maybe = (name: string, fn: () => Promise<void>) =>
  it(name, async () => {
    if (!dbReady) return;
    await fn();
  });

let bookingId: string;

describe("booking journey over HTTP", () => {
  maybe("a new person can register, and log in again", async () => {
    const signUp = await request(app)
      .post("/api/user/register")
      .send({ name: "Rita Renter", email: "rita@test.com", password: "password123" });
    expect(signUp.status).toBe(200);
    renterToken = signUp.body.token;

    const login = await request(app)
      .post("/api/user/login")
      .send({ email: "rita@test.com", password: "password123" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    const wrong = await request(app)
      .post("/api/user/login")
      .send({ email: "rita@test.com", password: "not-the-password" });
    expect(wrong.status).toBe(401);

    const second = await request(app)
      .post("/api/user/register")
      .send({ name: "Sam Stranger", email: "sam@test.com", password: "password123" });
    otherToken = second.body.token;
    expect(otherToken).toBeTruthy();
  });

  maybe("booking needs a login", async () => {
    const res = await request(app)
      .post("/api/bookings/create")
      .send({ car: carId, ...dates(10, 12) });
    expect(res.status).toBe(401);
  });

  maybe("refuses a booking with bad input", async () => {
    const badCar = await request(app)
      .post("/api/bookings/create")
      .set(bearer(renterToken))
      .send({ car: "nope", ...dates(10, 12) });
    expect(badCar.status).toBe(400);

    const backwards = await request(app)
      .post("/api/bookings/create")
      .set(bearer(renterToken))
      .send({ car: carId, ...dates(12, 10) });
    expect(backwards.status).toBe(400);
  });

  maybe("books the car, and the booking shows up in My bookings", async () => {
    const res = await request(app)
      .post("/api/bookings/create")
      .set(bearer(renterToken))
      .send({ car: carId, ...dates(10, 12) });
    expect(res.status).toBe(200);
    bookingId = res.body.bookingId;

    const mine = await request(app).get("/api/bookings/user").set(bearer(renterToken));
    expect(mine.body.bookings).toHaveLength(1);
    expect(mine.body.bookings[0]._id).toBe(bookingId);

    const other = await request(app).get("/api/bookings/user").set(bearer(otherToken));
    expect(other.body.bookings).toHaveLength(0);
  });

  maybe("the same dates cannot be booked twice", async () => {
    const res = await request(app)
      .post("/api/bookings/create")
      .set(bearer(otherToken))
      .send({ car: carId, ...dates(11, 13) });
    expect(res.status).toBe(409);
  });

  maybe("only the renter and the car's owner can open the booking", async () => {
    const renter = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(renterToken));
    expect(renter.status).toBe(200);
    const owner = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(ownerToken));
    expect(owner.status).toBe(200);
    const stranger = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(otherToken));
    expect(stranger.status).toBe(403);
  });

  maybe("somebody else cannot cancel it", async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set(bearer(otherToken));
    expect(res.status).toBe(403);
    expect((await Booking.findById(bookingId))?.status).not.toBe("cancelled");
  });

  maybe("cancelling needs a login and a real booking", async () => {
    const noLogin = await request(app).post(`/api/bookings/${bookingId}/cancel`);
    expect(noLogin.status).toBe(401);
    const missing = await request(app)
      .post(`/api/bookings/${new mongoose.Types.ObjectId()}/cancel`)
      .set(bearer(renterToken));
    expect(missing.status).toBe(404);
  });

  maybe("the renter can cancel, once, and the dates free up again", async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set(bearer(renterToken));
    expect(res.status).toBe(200);
    expect((await Booking.findById(bookingId))?.status).toBe("cancelled");

    const again = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set(bearer(renterToken));
    expect(again.status).toBe(400);

    const rebook = await request(app)
      .post("/api/bookings/create")
      .set(bearer(otherToken))
      .send({ car: carId, ...dates(10, 12) });
    expect(rebook.status).toBe(200);
  });

  maybe("a completed booking cannot be cancelled", async () => {
    await Booking.updateOne({ _id: bookingId }, { status: "completed" });
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set(bearer(renterToken));
    expect(res.status).toBe(400);
  });

  maybe("only the car's owner can change a booking's status", async () => {
    const renter = await request(app)
      .post(`/api/bookings/change-status/${bookingId}`)
      .set(bearer(renterToken))
      .send({ status: "confirmed" });
    expect(renter.status).toBe(403);

    const owner = await request(app)
      .post(`/api/bookings/change-status/${bookingId}`)
      .set(bearer(ownerToken))
      .send({ status: "confirmed" });
    expect(owner.status).toBe(200);
    expect((await Booking.findById(bookingId))?.status).toBe("confirmed");

    const invalid = await request(app)
      .post(`/api/bookings/change-status/${bookingId}`)
      .set(bearer(ownerToken))
      .send({ status: "banana" });
    expect(invalid.status).toBe(400);
  });
});
