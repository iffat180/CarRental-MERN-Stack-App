import { useCallback, useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";

/** A short car card the assistant looked at (the server's `collectCars`). */
export interface AssistantCar {
  id: string;
  name: string;
  city: string;
  price_per_day_usd: number;
  category?: string;
  seats?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cars?: AssistantCar[];
  /** an error bubble: shown differently, never sent back to the server */
  error?: boolean;
}

const STORAGE_KEY = "wayfarer-assistant-chat";
/** The server accepts at most 20 messages; send the recent ones, which is all the assistant needs. */
const HISTORY_SENT = 12;
const MAX_LENGTH = 1000;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Chat state is kept for this browser tab only (sessionStorage): it survives a refresh and is gone when the tab closes. */
const load = (): ChatMessage[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const save = (messages: ChatMessage[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // storage full or blocked: the chat still works, it just will not survive a refresh
  }
};

/** A message a person can read for each way the call can go wrong. */
export const friendlyError = (error: any): string => {
  const status = error?.response?.status;
  if (status === 429) return "You're sending messages quickly. Please wait a minute and try again.";
  if (status === 503 || status === 502) {
    return "The assistant isn't available right now. You can still browse the cars yourself.";
  }
  if (status === 400) return "That message couldn't be sent. Try shortening it.";
  if (!error?.response) return "I couldn't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
};

export const useAssistantChat = () => {
  const { axios } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>(load);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  useEffect(() => save(messages), [messages]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, MAX_LENGTH);
      if (!content || busy.current) return;
      busy.current = true;

      const userMessage: ChatMessage = { id: newId(), role: "user", content };
      const history = [...messages, userMessage];
      setMessages(history);
      setLoading(true);

      try {
        // error bubbles are ours, not part of the conversation
        const payload = history
          .filter((m) => !m.error)
          .slice(-HISTORY_SENT)
          .map(({ role, content }) => ({ role, content }));
        const { data } = await axios.post("/api/assistant", { messages: payload });
        if (!data?.success) throw new Error(data?.error || "failed");
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: data.reply, cars: data.cars ?? [] },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: friendlyError(error), error: true },
        ]);
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [axios, messages]
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, loading, send, clear };
};
