import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const post = vi.fn();
vi.mock("../../context/AppContext", () => ({
  useAppContext: () => ({
    axios: { post },
    cars: [{ _id: "abc", image: "https://d3c38yoff69w1u.cloudfront.net/cars/car17.jpg" }],
  }),
}));

import AssistantChat from "../../assistant/AssistantChat";

const renderChat = (props = {}) =>
  render(
    <MemoryRouter>
      <AssistantChat {...props} />
    </MemoryRouter>
  );

const answer = (text: string, cars: unknown[] = []) =>
  post.mockResolvedValue({ data: { success: true, reply: text, cars } });

describe("AssistantChat", () => {
  beforeEach(() => {
    post.mockReset();
    sessionStorage.clear();
  });

  it("starts as just a button, and opens a labelled chat panel", async () => {
    renderChat();
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Ask Wayfarer" }));
    const panel = screen.getByRole("dialog", { name: "Ask Wayfarer" });
    expect(panel).toHaveAccessibleDescription(/can't book them/);
    expect(screen.getByRole("log", { name: "Conversation" })).toBeTruthy();
  });

  it("puts the cursor in the message box when it opens", async () => {
    renderChat();
    await userEvent.click(screen.getByRole("button", { name: "Ask Wayfarer" }));
    expect(screen.getByLabelText("Your message")).toHaveFocus();
  });

  it("answers a question, with a car card that links to the car's page", async () => {
    answer("The Outback fits.", [
      { id: "abc", name: "2023 Subaru Outback", city: "Denver", price_per_day_usd: 95 },
    ]);
    renderChat({ defaultOpen: true });

    await userEvent.type(screen.getByLabelText("Your message"), "a car for skis{Enter}");

    expect(await screen.findByText("The Outback fits.")).toBeTruthy();
    const link = screen.getByRole("link", { name: /2023 Subaru Outback/ });
    expect(link.getAttribute("href")).toBe("/car-details/abc");
    expect(link).toHaveTextContent("Denver · $95 / day");
    // the user's own message is shown too, and the box is empty again
    expect(screen.getByText("a car for skis")).toBeTruthy();
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("sends a suggestion when it is pressed", async () => {
    answer("Here you go.");
    renderChat({ defaultOpen: true });

    await userEvent.click(screen.getByRole("button", { name: "A convertible for a weekend" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].messages[0].content).toBe("A convertible for a weekend");
  });

  it("cannot send an empty message, and Shift+Enter adds a line instead of sending", async () => {
    renderChat({ defaultOpen: true });
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    const box = screen.getByLabelText("Your message");
    await userEvent.type(box, "line one{Shift>}{Enter}{/Shift}line two");
    expect(box).toHaveValue("line one\nline two");
    expect(post).not.toHaveBeenCalled();
    expect(send).toBeEnabled();
  });

  it("shows a thinking indicator while it waits", async () => {
    let finish!: (v: unknown) => void;
    post.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderChat({ defaultOpen: true });

    await userEvent.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByRole("status", { name: "The assistant is thinking" })).toBeTruthy();

    finish({ data: { success: true, reply: "hello", cars: [] } });
    await screen.findByText("hello");
    expect(screen.queryByRole("status", { name: "The assistant is thinking" })).toBeNull();
  });

  it("shows a readable message when it fails", async () => {
    post.mockRejectedValue({ response: { status: 503 } });
    renderChat({ defaultOpen: true });

    await userEvent.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByText(/isn't available right now/)).toBeTruthy();
  });

  it("clears the conversation with New chat", async () => {
    answer("hello");
    renderChat({ defaultOpen: true });
    await userEvent.type(screen.getByLabelText("Your message"), "hi{Enter}");
    await screen.findByText("hello");

    await userEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(screen.queryByText("hello")).toBeNull();
    expect(screen.getByText(/Tell me about your trip/)).toBeTruthy();
  });

  it("closes with Escape or the close button, and gives focus back to the button", async () => {
    renderChat();
    const open = screen.getByRole("button", { name: "Ask Wayfarer" });

    await userEvent.click(open);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(open).toHaveFocus();

    await userEvent.click(open);
    await userEvent.click(screen.getByRole("button", { name: "Close chat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays open when you click somewhere else on the page", async () => {
    renderChat({ defaultOpen: true });
    await userEvent.click(document.body);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
