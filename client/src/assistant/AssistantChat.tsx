import React, { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { carImage } from "../utils/carImage";
import { useAssistantChat, type AssistantCar } from "./useAssistantChat";
import { formatMessage } from "./formatMessage";

const SUGGESTIONS = [
  "A car for 4 people and skis",
  "A convertible for a weekend",
  "What can I rent in Denver?",
];

const portalContainer = () => document.querySelector<HTMLElement>(".a4") ?? undefined;

const CarCard = ({ car, onOpen }: { car: AssistantCar; onOpen: () => void }) => {
  const { cars } = useAppContext();
  // the assistant sends no photos (they would only cost it tokens), so look the car up
  const photo = cars.find((c: { _id: string }) => c._id === car.id)?.image;

  return (
    <Link to={`/car-details/${car.id}`} className="a4-chat-car" onClick={onOpen}>
      {photo && <img src={carImage(photo)} alt="" loading="lazy" />}
      <span className="a4-chat-car-text">
        <strong>{car.name}</strong>
        <span>
          {car.city} · ${car.price_per_day_usd} / day
        </span>
      </span>
    </Link>
  );
};

/**
 * "Ask Wayfarer": a floating button that opens a chat with the assistant. It is not a
 * modal: the page behind stays usable and the panel stays open while you click around.
 * Focus moves into the panel when it opens and back to the button when it closes.
 */
const AssistantChat = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const { messages, loading, send, clear } = useAssistantChat();
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  // keep the newest message in view (and the "thinking" bubble)
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "end" });
  }, [messages, loading, open]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    setDraft("");
    void send(text);
    input.current?.focus();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" className="a4-chat-fab a4-primary" aria-label="Ask Wayfarer">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
          <span className="a4-chat-fab-label">Ask Wayfarer</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal container={portalContainer()}>
        <DialogPrimitive.Content
          className="a4-chat a4-glass"
          // a chat should stay open while you use the page behind it
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <header className="a4-chat-head">
            <div>
              <DialogPrimitive.Title className="disp a4-chat-title">
                Ask Wayfarer
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="a4-chat-sub">
                AI assistant. It can search and price cars, but it can&apos;t book them, and it can
                make mistakes.
              </DialogPrimitive.Description>
            </div>
            <div className="a4-chat-actions">
              {messages.length > 0 && (
                <button type="button" className="a4-chat-link" onClick={clear}>
                  New chat
                </button>
              )}
              <DialogPrimitive.Close className="a4-chat-close" aria-label="Close chat">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6 18 18M18 6 6 18" />
                </svg>
              </DialogPrimitive.Close>
            </div>
          </header>

          <div className="a4-chat-log" role="log" aria-live="polite" aria-label="Conversation">
            {messages.length === 0 && (
              <div className="a4-chat-empty">
                <p>Tell me about your trip and I&apos;ll find a car. For example:</p>
                <div className="a4-chat-suggestions">
                  {SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      className="a4-chip"
                      onClick={() => submit(text)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`a4-chat-msg ${m.role}${m.error ? " error" : ""}`}>
                <div className="a4-chat-text">{formatMessage(m.content)}</div>
                {m.cars && m.cars.length > 0 && (
                  <div className="a4-chat-cars">
                    {m.cars.map((car) => (
                      <CarCard key={car.id} car={car} onOpen={() => setOpen(false)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div
                className="a4-chat-msg assistant"
                role="status"
                aria-label="The assistant is thinking"
              >
                <span className="a4-chat-dots" aria-hidden="true">
                  <i /> <i /> <i />
                </span>
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form
            className="a4-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <label htmlFor="a4-chat-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="a4-chat-input"
              ref={input}
              rows={1}
              maxLength={1000}
              value={draft}
              placeholder="Describe your trip…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter makes a new line
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(draft);
                }
              }}
            />
            <button
              type="submit"
              className="a4-primary a4-chat-send"
              disabled={loading || !draft.trim()}
            >
              Send
            </button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default AssistantChat;
