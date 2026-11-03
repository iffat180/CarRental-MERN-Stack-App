/**
 * MCP server for Wayfarer's cars.
 *
 * MCP (Model Context Protocol) is the open standard desktop AI apps use
 * to call outside tools. This server gives them the same read-only car tools the
 * in-app assistant has: search, list by city, details, availability and price. It cannot
 * create or change bookings.
 *
 * createMcpServer() only builds the server; mcp/stdio.ts is the command that runs it.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { carTools, defaultDeps, runTool, type CarToolDeps } from "../ai/tools.js";

export const createMcpServer = (deps: CarToolDeps = defaultDeps): McpServer => {
  const server = new McpServer({ name: "wayfarer-cars", version: "1.0.0" });

  for (const tool of carTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        // tells the client these never change anything, so it can run them without asking
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      },
      async (args: unknown) => {
        const result = await runTool(tool, args, deps);
        const failed = typeof result === "object" && result !== null && "error" in result;
        return {
          isError: failed,
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  }

  return server;
};
