import { jest } from "@jest/globals";
import type { CarRecord, CarToolDeps } from "../../ai/tools.js";

export const OUTBACK_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
export const MIATA_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";

export const outback: CarRecord = {
  _id: OUTBACK_ID,
  brand: "Subaru",
  model: "Outback",
  year: 2023,
  category: "SUV",
  seating_capacity: 5,
  fuel_type: "Petrol",
  transmission: "Automatic",
  pricePerDay: 95,
  location: "Denver",
  description: "A roomy all-weather wagon.",
  mpg: 29,
  trunk_capacity: 850,
  tags: ["AWD", "Adventure"],
  reason: "All-wheel drive for mountain conditions.",
};

export const miata: CarRecord = {
  ...outback,
  _id: MIATA_ID,
  brand: "Mazda",
  model: "MX-5 Miata",
  category: "Convertible",
  seating_capacity: 2,
  pricePerDay: 80,
  location: "Los Angeles",
  trunk_capacity: 130,
};

/** Fake data sources: no database, vector index or OpenAI key needed. */
export const makeDeps = (over: Partial<CarToolDeps> = {}): CarToolDeps => ({
  recommend: jest.fn(async () => [outback, miata]) as unknown as CarToolDeps["recommend"],
  findCar: jest.fn(async (id: string) =>
    id === OUTBACK_ID ? outback : id === MIATA_ID ? miata : null
  ) as unknown as CarToolDeps["findCar"],
  findCarsInCity: jest.fn(async (city: string) =>
    city.toLowerCase() === "denver" ? [outback] : []
  ) as unknown as CarToolDeps["findCarsInCity"],
  isAvailable: jest.fn(async () => true) as unknown as CarToolDeps["isAvailable"],
  ...over,
});

/** A date this many days from today, as YYYY-MM-DD (UTC, like the tools read them). */
export const dayFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
