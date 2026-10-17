import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Status-Badge mit semantischen Farbtoenen.
 * Bewusst IMMER mit Text – keine reine Farbcodierung (Accessibility §36).
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand" | "dark";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-line/60 text-ink-soft",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  brand: "bg-green/20 text-green-deep",
  dark: "bg-dark text-paper",
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
