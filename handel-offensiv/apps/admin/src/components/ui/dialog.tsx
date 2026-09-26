"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Modaler Dialog auf Basis des nativen <dialog>-Elements:
 * Fokus-Handling, Escape und Backdrop kommen vom Browser.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Fussbereich, z. B. Abbrechen-/Speichern-Buttons */
  footer?: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="dialog-titel"
      className={cn(
        "w-full max-w-lg rounded border border-line bg-white p-0 text-ink shadow-xl",
        "backdrop:bg-dark/50",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="dialog-titel" className="text-base font-bold uppercase tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dialog schließen"
          className="flex min-h-touch min-w-touch items-center justify-center rounded text-xl leading-none text-ink-soft hover:bg-paper hover:text-ink"
        >
          ×
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-3 border-t border-line px-5 py-4">{footer}</div>
      ) : null}
    </dialog>
  );
}
