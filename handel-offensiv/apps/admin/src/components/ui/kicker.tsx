import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * VERSAL-Eyebrow mit Letterspacing und gruenem Slash-Element –
 * wie auf der Aigner-Offensiv-Website.
 */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-kicker text-ink-soft",
        className,
      )}
    >
      <span aria-hidden="true" className="font-extrabold text-green-deep">
        //
      </span>
      {children}
    </p>
  );
}
