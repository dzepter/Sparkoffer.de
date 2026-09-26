"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Submit-Button mit nativer Rueckfrage – fuer destruktive Form-Actions
 * (Loeschen). Bricht das Absenden ab, wenn die Rueckfrage verneint wird.
 */
export function ConfirmSubmit({
  message,
  children,
  className,
  ariaLabel,
}: {
  message: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "inline-flex min-h-touch items-center justify-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-danger hover:bg-danger/10",
        className,
      )}
    >
      {children}
    </button>
  );
}
