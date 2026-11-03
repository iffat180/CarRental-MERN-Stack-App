import { describe, it, expect } from "@jest/globals";
import {
  carTools,
  checkCarAvailability,
  estimatePrice,
  getCar,
  listCarsInCity,
  parseDay,
  parseRentalDates,
  rentalDays,
  runTool,
  searchCars,
  toOpenAITools,
  ToolError,
} from "../../ai/tools.js";
import { dayFromNow, makeDeps, MIATA_ID, OUTBACK_ID } from "./helpers.js";

describe("date helpers", () => {
  it("parses a real date and refuses nonsense", () => {
    expect(parseDay("2030-02-28", "d").toISOString()).toBe("2030-02-28T00:00:00.000Z");
    expect(() => parseDay("tomorrow", "pickup_date")).toThrow(ToolError);
    expect(() => parseDay("2030-02-30", "pickup_date")).toThrow(/not a real date/);
    expect(() => parseDay("2030-2-3", "pickup_date")).toThrow(/like 2026-12-05/);
  });

  it("applies the booking rules: not in the past, and return after pickup", () => {
    const now = new Date("2030-06-10T15:00:00Z");
    expect(() => parseRentalDates("2030-06-09", "2030-06-12", now)).toThrow(
      /cannot be in the past/
    );
    expect(() => parseRentalDates("2030-06-10", "2030-06-10", now)).toThrow(/after pickup_date/);
    expect(() => parseRentalDates("2030-06-12", "2030-06-11", now)).toThrow(/after pickup_date/);
    expect(parseRentalDates("2030-06-10", "2030-06-13", now).start.toISOString()).toContain(
      "2030-06-10"
    );
  });

  it("counts rental days like the booking code: whole days, at least 1", () => {
    const d = (s: string) => new Date(`${s}T00:00:00Z`);
    expect(rentalDays(d("2030-01-10"), d("2030-01-13"))).toBe(3);
    expect(rentalDays(d("2030-01-10"), d("2030-01-11"))).toBe(1);
    expect(rentalDays(d("2030-01-10"), d("2030-01-10"))).toBe(1);
  });
});

describe("search_cars", () => {
  it("returns short cards with the reason each car matched, at most 5", async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...makeDepsCar(),
      _id: `${i}`.padStart(24, "0"),
    }));
    const deps = makeDeps({ recommend: async () => many });
    const result: any = await runTool(
      searchCars,
      { query: "family SUV for a mountain trip" },
      deps
    );

    expect(result.cars).toHaveLength(5);
    expect(result.low_confidence).toBe(false);
    expect(result.cars[0]).toMatchObject({
      name: "2023 Subaru Outback",
      city: "Denver",
      price_per_day_usd: 95,
      why: "All-wheel drive for mountain conditions.",
    });
    expect(result.cars[0]).not.toHaveProperty("description"); // keeps the model's context small
  });

  it("uses car_id for search results, which come back without an _id (found with the live data)", async () => {
    const { _id, ...fromSearch } = { ...makeDepsCar(), car_id: OUTBACK_ID };
    const deps = makeDeps({ recommend: async () => [fromSearch] });
    const result: any = await runTool(
      searchCars,
      { query: "family SUV for a mountain trip" },
      deps
    );
    expect(result.cars[0].id).toBe(OUTBACK_ID);
  });

  it("passes the trip length on and defaults it to 3 days", async () => {
    const deps = makeDeps();
    await runTool(searchCars, { query: "weekend car" }, deps);
    await runTool(searchCars, { query: "week away", trip_days: 7 }, deps);
    expect((deps.recommend as any).mock.calls).toEqual([
      ["weekend car", 3],
      ["week away", 7],
    ]);
  });

  it("flags a low-confidence answer", async () => {
    const deps = makeDeps({ recommend: async () => ({ recommendations: [] }) });
    const result: any = await runTool(searchCars, { query: "something odd" }, deps);
    expect(result).toEqual({ low_confidence: true, cars: [] });
  });

  it("rejects a query that is too short instead of calling the search", async () => {
    const deps = makeDeps();
    const result: any = await runTool(searchCars, { query: "ab" }, deps);
    expect(result.error).toMatch(/query/);
    expect(deps.recommend).not.toHaveBeenCalled();
  });
});

describe("list_cars_in_city / get_car", () => {
  it("lists a city's cars, and says when there are none", async () => {
    const deps = makeDeps();
    expect(await runTool(listCarsInCity, { city: "Denver" }, deps)).toMatchObject({ count: 1 });
    expect(await runTool(listCarsInCity, { city: "Nowhere" }, deps)).toMatchObject({
      count: 0,
      cars: [],
    });
  });

  it("returns full details, including the description and tags", async () => {
    const result: any = await runTool(getCar, { car_id: OUTBACK_ID }, makeDeps());
    expect(result).toMatchObject({
      name: "2023 Subaru Outback",
      description: "A roomy all-weather wagon.",
      tags: ["AWD", "Adventure"],
    });
  });

  it("explains an unknown or malformed id instead of failing", async () => {
    const deps = makeDeps();
    expect(await runTool(getCar, { car_id: "cccccccccccccccccccccccc" }, deps)).toEqual({
      error: "No car with that id.",
    });
    const bad: any = await runTool(getCar, { car_id: "not-an-id" }, deps);
    expect(bad.error).toMatch(/24-character id/);
  });
});

describe("check_availability / estimate_price", () => {
  const dates = { pickup_date: dayFromNow(10), return_date: dayFromNow(14) };

  it("reports availability from the booking data", async () => {
    const free = makeDeps();
    const busy = makeDeps({ isAvailable: async () => false });
    expect(
      await runTool(checkCarAvailability, { car_id: OUTBACK_ID, ...dates }, free)
    ).toMatchObject({ available: true });
    expect(
      await runTool(checkCarAvailability, { car_id: OUTBACK_ID, ...dates }, busy)
    ).toMatchObject({ available: false });
  });

  it("quotes days times the daily price", async () => {
    const result: any = await runTool(estimatePrice, { car_id: MIATA_ID, ...dates }, makeDeps());
    expect(result).toMatchObject({ days: 4, price_per_day_usd: 80, total_usd: 320 });
  });

  it("refuses bad dates with a message the model can act on", async () => {
    const deps = makeDeps();
    const past: any = await runTool(
      estimatePrice,
      { car_id: OUTBACK_ID, pickup_date: "2001-01-01", return_date: "2001-01-05" },
      deps
    );
    expect(past.error).toMatch(/past/);
    const backwards: any = await runTool(
      checkCarAvailability,
      { car_id: OUTBACK_ID, pickup_date: dayFromNow(9), return_date: dayFromNow(8) },
      deps
    );
    expect(backwards.error).toMatch(/after pickup_date/);
    expect(deps.isAvailable).not.toHaveBeenCalled();
  });
});

describe("runTool", () => {
  it("turns an unexpected failure into a safe message, without leaking the cause", async () => {
    const deps = makeDeps({
      findCar: async () => {
        throw new Error("mongo://user:secret@host exploded");
      },
    });
    const result: any = await runTool(getCar, { car_id: OUTBACK_ID }, deps);
    expect(result).toEqual({ error: "That lookup failed. Try again in a moment." });
  });
});

describe("tool list", () => {
  it("has the five read-only tools, none that book", () => {
    expect(carTools.map((t) => t.name)).toEqual([
      "search_cars",
      "list_cars_in_city",
      "get_car",
      "check_availability",
      "estimate_price",
    ]);
    expect(carTools.map((t) => t.name).join(" ")).not.toMatch(/book|create|cancel|delete|update/);
  });

  it("describes each tool to OpenAI as a JSON-schema function", () => {
    const tools = toOpenAITools();
    expect(tools).toHaveLength(5);
    const search: any = tools.find((t) => t.function.name === "search_cars");
    expect(search.type).toBe("function");
    expect(search.function.parameters.type).toBe("object");
    expect(search.function.parameters.required).toContain("query");
    expect(search.function.parameters).not.toHaveProperty("$schema");
    expect(search.function.parameters.properties.trip_days.maximum).toBe(30);
  });
});

function makeDepsCar() {
  return {
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
    description: "long description",
    mpg: 29,
    trunk_capacity: 850,
    tags: [],
    reason: "All-wheel drive for mountain conditions.",
  };
}
