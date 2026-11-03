import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OwnerOnboardingModal from "../../components/owner/OwnerOnboardingModal";

const props = { onClose: vi.fn(), onBecomeOwner: vi.fn(), isSubmitting: false };

describe("OwnerOnboardingModal", () => {
  it("renders nothing while closed", () => {
    render(<OwnerOnboardingModal isOpen={false} {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // Regression: an early `return null` before the last useEffect changed the
  // number of hooks when the modal opened, which crashed the whole page.
  it("opens after being closed without crashing", () => {
    const { rerender } = render(<OwnerOnboardingModal isOpen={false} {...props} />);
    rerender(<OwnerOnboardingModal isOpen={true} {...props} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Why become an owner?")).toBeTruthy();
  });
});
