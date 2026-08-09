import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  /** Freundliche Erklaerung + naechster Schritt */
  description?: ReactNode;
  /** z. B. Button "Anlegen" */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "pitch-lines flex flex-col items-center justify-center rounded border border-dashed border-line bg-paper px-6 py-12 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="text-lg font-extrabold text-green-deep">
        //
      </span>
      <h3 className="mt-2 text-base font-bold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
