import React, {
  forwardRef,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/**
 * Accessible modal dialog, built on Radix UI (shadcn/ui style: Radix behaviour,
 * our own styling). Radix provides what the hand-written modals lacked: focus is
 * trapped inside, restored to the button that opened it, Escape closes it, the page
 * behind is hidden from screen readers and cannot scroll.
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent className="w-80 p-6">
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>What this is about</DialogDescription>
 *       ...
 *     </DialogContent>
 *   </Dialog>
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

// All styling is scoped under .a4, so the dialog must render inside it, not in <body>.
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

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className = "", children, onCloseAutoFocus, ...props }, ref) => {
  const restoreFocus = useRestoreFocus();
  return (
    <DialogPrimitive.Portal container={portalContainer()}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/50" />
      <DialogPrimitive.Content
        ref={ref}
        className={`a4-modal fixed left-1/2 top-1/2 z-100 flex max-h-[92vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-lg border border-gray-200 text-sm text-gray-600 shadow-xl focus:outline-none ${className}`}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented) restoreFocus(event);
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DialogContent.displayName = "DialogContent";

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>((props, ref) => <DialogPrimitive.Title ref={ref} {...props} />);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((props, ref) => <DialogPrimitive.Description ref={ref} {...props} />);
DialogDescription.displayName = "DialogDescription";
