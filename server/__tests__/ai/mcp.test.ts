import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../mcp/server.js";
import { dayFromNow, makeDeps, OUTBACK_ID } from "./helpers.js";

// Talks to the real MCP server through an in-memory pipe, like a real MCP client app
// would, but with fake data sources.
let client: Client;

beforeAll(async () => {
  const server = createMcpServer(makeDeps());
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-client", version: "1.0.0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
});

afterAll(async () => {
  await client.close();
});

const call = async (name: string, args: Record<string, unknown>) => {
  const result: any = await client.callTool({ name, arguments: args });
  return { ...result, data: JSON.parse(result.content[0].text) };
};

describe("Wayfarer MCP server", () => {
  it("lists the five car tools, each marked read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "check_availability",
      "estimate_price",
      "get_car",
      "list_cars_in_city",
      "search_cars",
    ]);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.description).toBeTruthy();
    }
    const search: any = tools.find((t) => t.name === "search_cars");
    expect(search.inputSchema.required).toContain("query");
  });

  it("runs a search and returns the cars as JSON text", async () => {
    const result = await call("search_cars", { query: "family SUV for a mountain trip" });
    expect(result.isError).toBe(false);
    expect(result.data.cars[0].name).toBe("2023 Subaru Outback");
  });

  it("quotes a price", async () => {
    const result = await call("estimate_price", {
      car_id: OUTBACK_ID,
      pickup_date: dayFromNow(30),
      return_date: dayFromNow(32),
    });
    expect(result.isError).toBe(false);
    expect(result.data).toMatchObject({ days: 2, total_usd: 190 });
  });

  it("reports a problem with isError, so the client can show it", async () => {
    const result = await call("estimate_price", {
      car_id: OUTBACK_ID,
      pickup_date: "2001-01-01",
      return_date: "2001-01-03",
    });
    expect(result.isError).toBe(true);
    expect(result.data.error).toMatch(/past/);

    const unknown = await call("get_car", { car_id: "cccccccccccccccccccccccc" });
    expect(unknown.isError).toBe(true);
  });

  it("has no tool that can change a booking", async () => {
    const { tools } = await client.listTools();
    expect(tools.some((t) => /book|create|cancel|delete|update/.test(t.name))).toBe(false);
  });
});
