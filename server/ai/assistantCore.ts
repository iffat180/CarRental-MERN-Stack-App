/**
 * Assistant Core
 *
 * A chat assistant that helps people find and price a car, using OpenAI function
 * calling. It can only use the read-only car tools in ai/tools.ts: it searches, looks
 * up cars, checks dates and quotes a price. It cannot make a booking, and it is told
 * to send people to the website for that.
 *
 * All business data stays in MongoDB. This module only runs the conversation: it asks
 * the model, runs the tools the model asks for, feeds the results back, and repeats
 * until the model answers in words (or a step limit is reached, so a confused model
 * cannot loop and spend money forever).
 */
import type OpenAI from "openai";
import { getOpenAIClient } from "./openaiClient.js";
import {
  carTools,
  defaultDeps,
  runTool,
  toOpenAITools,
  type CarTool,
  type CarToolDeps,
} from "./tools.js";

export interface AssistantMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCallRecord {
  name: string;
  arguments: unknown;
  result: unknown;
}

export interface AssistantResult {
  message: { role: "assistant"; content: string };
  /** The tools the assistant used, in order, with what they returned. */
  toolCalls: ToolCallRecord[];
  finishReason: string;
}

export interface AssistantOptions {
  /** The OpenAI client; defaults to the shared one. Tests pass a fake. */
  client?: Pick<OpenAI, "chat">;
  tools?: readonly CarTool<any>[];
  deps?: CarToolDeps;
  model?: string;
  /** Most model calls in one conversation turn. */
  maxSteps?: number;
  now?: Date;
}

export const systemPrompt = (now: Date): string =>
  [
    "You are the assistant for Wayfarer, a site where people rent cars directly from their owners.",
    `Today's date is ${now.toISOString().slice(0, 10)}.`,
    "Help visitors find a car for their trip, compare options, check dates and work out a price.",
    "Use the tools for every fact about cars, availability and prices. Never invent a car, a price or an availability; if a tool does not return it, say you do not know.",
    "You cannot book a car. When someone wants to book, tell them to open the car's page on the website and pick their dates there.",
    "Prices are in US dollars per day. Keep answers short and friendly, and mention the car's name, city and daily price when you recommend one.",
    "Write plain text: no markdown, no asterisks or headings. For a list, put each item on its own line starting with a dash.",
    "If a request is not about renting a car on Wayfarer, politely say that you can only help with that.",
  ].join(" ");

const MAX_STEPS = 5;

/** Checks the conversation is well formed; throws a plain Error with the reason. */
const validate = (messages: AssistantMessage[], tools: unknown) => {
  if (!Array.isArray(messages)) throw new Error("Messages must be an array");
  if (messages.length === 0) throw new Error("Messages array cannot be empty");

  for (const message of messages) {
    if (!message || typeof message !== "object") throw new Error("Each message must be an object");
    if (!message.role || typeof message.role !== "string") {
      throw new Error("Each message must have a 'role' property (string)");
    }
    if (!["user", "assistant", "system"].includes(message.role)) {
      throw new Error("Message role must be 'user', 'assistant', or 'system'");
    }
    if (!message.content || typeof message.content !== "string") {
      throw new Error("Each message must have a 'content' property (string)");
    }
  }
  if (tools && !Array.isArray(tools)) throw new Error("Tools must be an array");
};

export const runAssistantConversation = async (
  messages: AssistantMessage[],
  options: AssistantOptions = {}
): Promise<AssistantResult> => {
  validate(messages, options.tools);

  const tools = options.tools ?? carTools;
  const deps = options.deps ?? defaultDeps;
  const client = options.client ?? getOpenAIClient();
  const model = options.model ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
  const maxSteps = options.maxSteps ?? MAX_STEPS;
  const openaiTools = toOpenAITools(tools);
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt(options.now ?? new Date()) },
    // a "system" message from a caller is kept, but after ours, so it cannot replace the rules
    ...messages,
  ];
  const toolCalls: ToolCallRecord[] = [];

  for (let step = 0; step < maxSteps; step++) {
    const completion = await client.chat.completions.create({
      model,
      messages: conversation,
      tools: openaiTools,
      temperature: 0.2,
    });

    const choice = completion.choices[0];
    const reply = choice.message;
    conversation.push(reply);

    if (!reply.tool_calls?.length) {
      return {
        message: { role: "assistant", content: reply.content ?? "" },
        toolCalls,
        finishReason: choice.finish_reason,
      };
    }

    for (const call of reply.tool_calls) {
      if (call.type !== "function") continue;
      const tool = byName.get(call.function.name);

      let args: unknown = {};
      let result: unknown;
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        result = { error: "The arguments were not valid JSON." };
      }
      if (result === undefined) {
        result = tool
          ? await runTool(tool, args, deps)
          : { error: `Unknown tool: ${call.function.name}` };
      }

      toolCalls.push({ name: call.function.name, arguments: args, result });
      conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return {
    message: {
      role: "assistant",
      content: "I couldn't finish that request. Could you try asking it a different way?",
    },
    toolCalls,
    finishReason: "max_steps",
  };
};
