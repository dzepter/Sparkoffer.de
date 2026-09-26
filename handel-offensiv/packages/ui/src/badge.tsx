import type { ReactNode } from "react";

import { cn } from "./cn";

/**
 * Status-Badge mit semantischen Farbtoenen.
 * Bewusst IMMER mit Text – keine reine Farbcodierung (Accessibility).
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand" | "dark" | "gold";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-line/60 text-ink-soft",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  brand: "bg-navy/10 text-navy",
  dark: "bg-navy text-paper",
  gold: "bg-gold-bright text-navy",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-kicker",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
