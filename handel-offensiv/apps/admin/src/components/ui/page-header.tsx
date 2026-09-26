import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Kicker } from "@/components/ui/kicker";

export interface PageHeaderProps {
  /** VERSAL-Eyebrow ueber dem Titel, z. B. "Cockpit" */
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
    <header className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
