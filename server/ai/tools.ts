/**
 * The car tools: what an AI assistant is allowed to do on Wayfarer.
 *
 * The same tools are offered two ways, so they are defined once:
 *   - to the in-app assistant, as OpenAI function-calling tools (ai/assistantCore.ts)
 *   - to any MCP client app, as MCP tools (mcp/server.ts)
 *
 * They are all READ-ONLY on purpose: an assistant can search, look up, check dates and
 * quote a price, but it cannot create or change a booking. Booking stays a deliberate
 * action by a logged-in person on the website.
 *
 * Where the data comes from is injected (CarToolDeps), so the tools can be tested
 * without a database, a vector index or an OpenAI key.
 */
import { z } from "zod/v4";
import Car from "../models/Car.js";
import { checkAvailability } from "../controllers/bookingController.js";
import { recommendSmartCars } from "./recommendationService.js";

/** A problem the model (or person) can fix, such as a bad date. It is reported back, not thrown to the user. */
export class ToolError extends Error {}

/** The slice of a car record the tools show. */
export interface CarRecord {
  /** Cars read from the database have `_id`; search results carry the same value as `car_id`. */
  _id?: unknown;
  car_id?: unknown;
  brand: string;
  model: string;
  year: number;
  category: string;
  seating_capacity: number;
  fuel_type: string;
  transmission: string;
  pricePerDay: number;
  location: string;
  description?: string;
  mpg?: number;
  trunk_capacity?: number;
  tags?: string[];
  reason?: string;
}

export interface CarToolDeps {
  /** Semantic search ("family SUV for a mountain trip"). */
  recommend: (
    query: string,
    tripDays: number
  ) => Promise<CarRecord[] | { recommendations?: CarRecord[] }>;
  findCar: (id: string) => Promise<CarRecord | null>;
  findCarsInCity: (city: string) => Promise<CarRecord[]>;
  isAvailable: (id: string, pickup: Date, dropoff: Date) => Promise<boolean>;
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const defaultDeps: CarToolDeps = {
  recommend: (query, tripDays) => recommendSmartCars(query, tripDays),
  findCar: (id) => Car.findById(id).lean() as unknown as Promise<CarRecord | null>,
  findCarsInCity: (city) =>
    Car.find({ location: new RegExp(`^${escapeRegex(city.trim())}$`, "i"), isAvailable: true })
      .limit(10)
      .lean() as unknown as Promise<CarRecord[]>,
  isAvailable: (id, pickup, dropoff) => checkAvailability(id, pickup, dropoff),
};

// ----------------------------------------------------------------------------
// small helpers (exported for tests)
// ----------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-12-05" as a UTC date, or a ToolError saying what is wrong. */
export const parseDay = (value: string, label: string): Date => {
  if (!DATE.test(value)) throw new ToolError(`${label} must be a date like 2026-12-05.`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ToolError(`${label} is not a real date.`);
  }
  return date;
};

/** Checks the same rules the booking form uses and returns the two dates. */
export const parseRentalDates = (pickup: string, dropoff: string, now = new Date()) => {
  const start = parseDay(pickup, "pickup_date");
  const end = parseDay(dropoff, "return_date");
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (start < today) throw new ToolError("pickup_date cannot be in the past.");
  if (end <= start) throw new ToolError("return_date must be after pickup_date.");
  return { start, end };
};

/** Whole rental days, never fewer than 1 (the same rule the booking code uses to price a trip). */
export const rentalDays = (start: Date, end: Date): number =>
  Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));

const idOf = (car: CarRecord) => String(car._id ?? car.car_id);

const carId = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "car_id must be the 24-character id returned by a search");

/** A short card for a car. */
export const summarize = (car: CarRecord) => ({
  id: idOf(car),
  name: `${car.year} ${car.brand} ${car.model}`,
  city: car.location,
  category: car.category,
  seats: car.seating_capacity,
  fuel: car.fuel_type,
  transmission: car.transmission,
  trunk_litres: car.trunk_capacity ?? null,
  mpg: car.mpg ?? null,
  price_per_day_usd: car.pricePerDay,
});

// ----------------------------------------------------------------------------
// the tools
// ----------------------------------------------------------------------------

export interface CarTool<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: Shape;
  run: (args: z.infer<z.ZodObject<Shape>>, deps: CarToolDeps) => Promise<unknown>;
}

const defineTool = <Shape extends z.ZodRawShape>(tool: CarTool<Shape>) => tool;

export const searchCars = defineTool({
  name: "search_cars",
  description:
    "Find cars that fit a trip described in plain words, ranked by how well they match. " +
    "Use this first when someone says what they need (people, luggage, terrain, budget, style).",
  inputSchema: {
    query: z
      .string()
      .min(3)
      .max(300)
      .describe("The trip in plain words, e.g. 'family SUV for a mountain trip with luggage'"),
    trip_days: z.number().int().min(1).max(30).default(3).describe("How many days the trip lasts"),
  },
  run: async ({ query, trip_days }, deps) => {
    const result = await deps.recommend(query, trip_days);
    const list = Array.isArray(result) ? result : (result?.recommendations ?? []);
    const lowConfidence = !Array.isArray(result);
    return {
      low_confidence: lowConfidence,
      cars: list.slice(0, 5).map((car) => ({ ...summarize(car), why: car.reason ?? null })),
    };
  },
});

export const listCarsInCity = defineTool({
  name: "list_cars_in_city",
  description: "List the cars available to rent in one city (up to 10).",
  inputSchema: {
    city: z.string().min(2).max(60).describe("City name, e.g. 'Denver'"),
  },
  run: async ({ city }, deps) => {
    const cars = await deps.findCarsInCity(city);
    return { city, count: cars.length, cars: cars.map(summarize) };
  },
});

export const getCar = defineTool({
  name: "get_car",
  description: "Get the full details of one car: specs, description and tags.",
  inputSchema: { car_id: carId },
  run: async ({ car_id }, deps) => {
    const car = await deps.findCar(car_id);
    if (!car) throw new ToolError("No car with that id.");
    return { ...summarize(car), description: car.description ?? "", tags: car.tags ?? [] };
  },
});

const dateInputs = {
  car_id: carId,
  pickup_date: z.string().describe("First day of the rental, YYYY-MM-DD"),
  return_date: z.string().describe("Day the car comes back, YYYY-MM-DD, after pickup_date"),
};

export const checkCarAvailability = defineTool({
  name: "check_availability",
  description:
    "Check whether one car is free for a range of dates (it can still be booked by someone else later).",
  inputSchema: dateInputs,
  run: async ({ car_id, pickup_date, return_date }, deps) => {
    const { start, end } = parseRentalDates(pickup_date, return_date);
    const car = await deps.findCar(car_id);
    if (!car) throw new ToolError("No car with that id.");
    const available = await deps.isAvailable(car_id, start, end);
    return { car: summarize(car).name, pickup_date, return_date, available };
  },
});

export const estimatePrice = defineTool({
  name: "estimate_price",
  description: "Work out what a rental would cost: the daily price times the number of days.",
  inputSchema: dateInputs,
  run: async ({ car_id, pickup_date, return_date }, deps) => {
    const { start, end } = parseRentalDates(pickup_date, return_date);
    const car = await deps.findCar(car_id);
    if (!car) throw new ToolError("No car with that id.");
    const days = rentalDays(start, end);
    return {
      car: summarize(car).name,
      days,
      price_per_day_usd: car.pricePerDay,
      total_usd: days * car.pricePerDay,
    };
  },
});

export const carTools = [
  searchCars,
  listCarsInCity,
  getCar,
  checkCarAvailability,
  estimatePrice,
] as const;
export type AnyCarTool = (typeof carTools)[number];

/** The tools in the shape OpenAI's function calling expects. */
export const toOpenAITools = (tools: readonly CarTool<any>[] = carTools) =>
  tools.map((tool) => {
    const { $schema: _ignored, ...parameters } = z.toJSONSchema(
      z.object(tool.inputSchema)
    ) as Record<string, unknown>;
    return {
      type: "function" as const,
      function: { name: tool.name, description: tool.description, parameters },
    };
  });

/** The short card for a car, as shown to people next to the assistant's answer. */
export type CarCard = ReturnType<typeof summarize>;

const isCarCard = (value: unknown): value is CarCard =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as CarCard).id === "string" &&
  typeof (value as CarCard).name === "string" &&
  typeof (value as CarCard).price_per_day_usd === "number";

/**
 * The distinct cars the tools returned during a conversation turn (from searches,
 * city listings and detail lookups), so the website can show them as cards. Order is
 * kept, and the list is capped.
 */
export const collectCars = (calls: { result: unknown }[], limit = 5): CarCard[] => {
  const seen = new Map<string, CarCard>();
  for (const { result } of calls) {
    if (typeof result !== "object" || result === null) continue;
    const found = Array.isArray((result as { cars?: unknown }).cars)
      ? (result as { cars: unknown[] }).cars
      : [result];
    for (const item of found) {
      if (isCarCard(item) && !seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return [...seen.values()].slice(0, limit);
};

/**
 * Validates the arguments and runs a tool. Never throws for a bad call: it returns
 * { error } so the model can read it and try again.
 */
export const runTool = async (
  tool: CarTool<any>,
  rawArgs: unknown,
  deps: CarToolDeps = defaultDeps
): Promise<unknown> => {
  const parsed = z.object(tool.inputSchema).safeParse(rawArgs);
  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
        .join("; "),
    };
  }
  try {
    return await tool.run(parsed.data, deps);
  } catch (err) {
    if (err instanceof ToolError) return { error: err.message };
    console.error(`[tools] ${tool.name} failed:`, err instanceof Error ? err.message : err);
    return { error: "That lookup failed. Try again in a moment." };
  }
};
