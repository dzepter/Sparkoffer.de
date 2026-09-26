import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Optionaler Kopfbereich (Titel links, Aktion rechts) */
  title?: ReactNode;
  action?: ReactNode;
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <section className={cn("rounded border border-line bg-white", className)}>
      {title !== undefined || action !== undefined ? (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {typeof title === "string" ? (
            <h2 className="text-base font-bold text-ink">{title}</h2>
          ) : (
            title
          )}
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
