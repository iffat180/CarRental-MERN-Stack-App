import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../../components/owner/ConfirmModal";

const setup = (props = {}) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmModal
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete car?"
      message="This cannot be undone."
      confirmLabel="Delete"
      {...props}
    />
  );
  return { onClose, onConfirm, user: userEvent.setup() };
};

describe("ConfirmModal (alert dialog)", () => {
  it("is announced as an alert dialog with its title and message", () => {
    setup();
    const dialog = screen.getByRole("alertdialog", { name: "Delete car?" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("starts with focus on Cancel so Enter cannot delete by accident", () => {
    setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("calls onConfirm when the confirm button is pressed", async () => {
    const { user, onConfirm } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("asks to close on Cancel and on Escape", async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing when closed", () => {
    setup({ isOpen: false });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
