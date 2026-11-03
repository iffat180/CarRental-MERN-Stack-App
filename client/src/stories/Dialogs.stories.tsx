import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ConfirmModal from "../components/owner/ConfirmModal";
import OwnerOnboardingModal from "../components/owner/OwnerOnboardingModal";

const meta = {
  title: "Overlays/Dialogs",
  parameters: {
    docs: {
      description: {
        component:
          "Built on Radix UI. Try it: Tab stays inside the dialog, Escape closes it, and focus returns to the button that opened it.",
      },
    },
  },
} satisfies Meta;
export default meta;

const Opener = ({
  children,
}: {
  children: (open: boolean, setOpen: (v: boolean) => void) => React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="a4-primary"
        style={{ borderRadius: 12, padding: "0 24px", minHeight: 48 }}
        onClick={() => setOpen(true)}
      >
        Open dialog
      </button>
      {children(open, setOpen)}
    </>
  );
};

export const DeleteConfirmation: StoryObj = {
  render: () => (
    <Opener>
      {(open, setOpen) => (
        <ConfirmModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
          title="Delete this car?"
          message="This removes the listing for good and cannot be undone."
          confirmLabel="Delete car"
        />
      )}
    </Opener>
  ),
};

export const OwnerOnboarding: StoryObj = {
  render: () => (
    <Opener>
      {(open, setOpen) => (
        <OwnerOnboardingModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onBecomeOwner={() => setOpen(false)}
          isSubmitting={false}
        />
      )}
    </Opener>
  ),
};
