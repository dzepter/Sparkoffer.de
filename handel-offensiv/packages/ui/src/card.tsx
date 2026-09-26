import type { ReactNode } from "react";

import { cn } from "./cn";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Optionaler Kopfbereich (Titel links, Aktion rechts) */
  title?: ReactNode;
  action?: ReactNode;
  /** Goldene Oberkante = ausgewaehlte Hervorhebung (sparsam) */
  highlighted?: boolean;
  /** Innenabstand des Inhalts (Default p-5) */
  padding?: "none" | "sm" | "md";
}

const PADDING = { none: "", sm: "p-4", md: "p-5" } as const;

export function Card({ children, className, title, action, highlighted = false, padding = "md" }: CardProps) {
  return (
    <section
      className={cn(
        "rounded border border-line bg-white",
        highlighted && "border-t-[3px] border-t-gold",
        className,
      )}
    >
      {title !== undefined || action !== undefined ? (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {typeof title === "string" ? <h2 className="text-base font-bold text-ink">{title}</h2> : title}
          {action}
        </header>
      ) : null}
      <div className={PADDING[padding]}>{children}</div>
    </section>
  );
}
