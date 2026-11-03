/**
 * Assistant route: a chat endpoint backed by the car tools.
 * POST /api/assistant  { messages: [{ role: "user" | "assistant", content }] }
 */
import express from "express";
import { runAssistantConversation } from "../ai/assistantCore.js";
import { userLimiter } from "../middleware/rateLimiters.js";
import { errMessage } from "../utils/errors.js";

const MAX_MESSAGES = 20;
const MAX_CONTENT = 1000;

type Run = typeof runAssistantConversation;

/** Built from a function so tests can swap out the real (paid) model. */
export const createAssistantRouter = (run: Run = runAssistantConversation) => {
  const router = express.Router();

  router.post("/assistant", userLimiter, async (req, res) => {
    const { messages } = req.body ?? {};

    // Callers may only speak as the user or the assistant. A "system" message from a
    // browser could rewrite the assistant's rules, so it is refused.
    const valid =
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages.length <= MAX_MESSAGES &&
      messages.every(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0 &&
          m.content.length <= MAX_CONTENT
      ) &&
      messages[messages.length - 1].role === "user";

    if (!valid) {
      return res.status(400).json({
        success: false,
        error: `Send 1 to ${MAX_MESSAGES} messages (user or assistant, up to ${MAX_CONTENT} characters each), the last from the user.`,
      });
    }

    try {
      const result = await run(messages);
      return res.json({
        success: true,
        reply: result.message.content,
        toolsUsed: result.toolCalls.map((call) => call.name),
      });
    } catch (error) {
      console.error("[assistant] failed:", errMessage(error));
      const notConfigured = /OPENAI_API_KEY/.test(errMessage(error));
      return res.status(notConfigured ? 503 : 502).json({
        success: false,
        error: "The assistant is not available right now. Please try again later.",
      });
    }
  });

  return router;
};
