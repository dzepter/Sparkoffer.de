import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ERROR_MESSAGES } from "@/lib/errors";

export interface ErrorStateProps {
  title?: string;
  /** Bereits uebersetzte, deutsche Meldung (NIE technische Codes) */
  message?: string;
  /** z. B. "Erneut versuchen"-Button */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Da ist etwas schiefgelaufen",
  message = ERROR_MESSAGES.load,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded border border-danger/30 bg-danger/5 px-6 py-10 text-center",
        className,
      )}
    >
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
