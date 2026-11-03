import React, {
  forwardRef,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

/**
 * A dialog for a decision that must be answered (for example "delete this car?").
 * Unlike a normal dialog it has role="alertdialog", does not close when the dark
 * background is clicked, and puts focus on the Cancel button first so Enter cannot
 * confirm by accident.
 */
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

const portalContainer = () => document.querySelector<HTMLElement>(".a4") ?? undefined;

/**
 * Remembers which element had focus when the dialog opened, so closing it can
 * give focus back there. Radix only does this for dialogs opened through a
 * <DialogTrigger>; ours are opened from state (a button click sets a flag).
 */
const useRestoreFocus = () => {
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
  }, []);
  return (event: Event) => {
    event.preventDefault();
    opener.current?.focus();
  };
};

export const AlertDialogContent = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className = "", children, onCloseAutoFocus, ...props }, ref) => {
  const restoreFocus = useRestoreFocus();
  return (
    <AlertDialogPrimitive.Portal container={portalContainer()}>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/50" />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={`a4-modal fixed left-1/2 top-1/2 z-100 flex max-h-[92vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-lg border border-gray-200 text-sm text-gray-600 shadow-xl focus:outline-none ${className}`}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented) restoreFocus(event);
        }}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

export const AlertDialogTitle = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>((props, ref) => <AlertDialogPrimitive.Title ref={ref} {...props} />);
AlertDialogTitle.displayName = "AlertDialogTitle";

export const AlertDialogDescription = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>((props, ref) => <AlertDialogPrimitive.Description ref={ref} {...props} />);
AlertDialogDescription.displayName = "AlertDialogDescription";
