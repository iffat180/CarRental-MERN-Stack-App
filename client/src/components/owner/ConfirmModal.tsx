import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" (red) or "primary" */
  confirmVariant?: "danger" | "primary";
}

/** "Are you sure?" for actions that cannot be undone. Focus starts on Cancel. */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
}: ConfirmModalProps) => (
  <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <AlertDialogContent className="items-start gap-4 p-6 w-80 sm:w-[400px]">
      <AlertDialogTitle className="text-xl font-semibold">{title}</AlertDialogTitle>
      <AlertDialogDescription className="text-gray-600">{message}</AlertDialogDescription>
      <div className="flex gap-3 w-full">
        <AlertDialogCancel className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={`flex-1 px-4 py-2 rounded-lg text-white ${
            confirmVariant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary hover:bg-primary-dull"
          }`}
        >
          {confirmLabel}
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmModal;
