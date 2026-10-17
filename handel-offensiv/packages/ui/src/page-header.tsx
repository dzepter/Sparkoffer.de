import type { ReactNode } from "react";

import { cn } from "./cn";
import { Kicker } from "./kicker";

export interface PageHeaderProps {
  /** VERSAL-Eyebrow ueber dem Titel, z. B. "Heute" */
  kicker: string;
  title: string;
  /** Optionaler erlaeuternder Satz unter dem Titel */
  description?: ReactNode;
  /** Aktionen rechts (z. B. Primaer-Button) */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ kicker, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", className)}>
      <div className="min-w-0">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
