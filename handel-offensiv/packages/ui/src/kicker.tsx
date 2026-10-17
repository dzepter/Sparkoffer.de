import type { ReactNode } from "react";

import { cn } from "./cn";

/**
 * VERSAL-Eyebrow mit Letterspacing und kurzer Taktiklinie in Gold.
 * `onDark` fuer Navy-Flaechen.
 */
export function Kicker({
  children,
  className,
  onDark = false,
}: {
  children: ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-kicker",
        onDark ? "text-gold-bright" : "text-gold-deep",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("h-0.5 w-5", onDark ? "bg-gold-bright" : "bg-gold")} />
      {children}
    </p>
  );
}
