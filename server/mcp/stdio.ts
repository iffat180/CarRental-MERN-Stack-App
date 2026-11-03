/**
 * Runs the Wayfarer MCP server over stdio, for local MCP client apps.
 *
 *   npm run mcp
 *
 * It connects to the same MongoDB (MONGODB_URI) and, for search, the same OpenAI and
 * Pinecone keys as the main server. See the README for the client configuration.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

// With stdio the protocol itself travels on stdout, so anything else printed there would
// corrupt it. Send every log line to stderr instead.
console.log = (...args: unknown[]) => console.error(...args);
console.info = console.log;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
await createMcpServer().connect(new StdioServerTransport());
console.error("Wayfarer MCP server ready (stdio)");
