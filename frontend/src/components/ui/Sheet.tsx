import { type PropsWithChildren, useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

type SheetProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
}>;

export const Sheet = ({ open, onClose, title, children }: SheetProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-brand-50 hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};
