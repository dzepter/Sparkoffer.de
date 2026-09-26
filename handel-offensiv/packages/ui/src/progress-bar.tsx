import { cn } from "./cn";

export interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  /** Sichtbare Beschriftung, z. B. "3 von 8 Lektionen" */
  label?: string;
  className?: string;
}

/** Fortschritt in Gold – einer der wenigen erlaubten Gold-Einsaetze. */
export function ProgressBar({ percent, label, className }: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>{label}</span>
          <span className="font-bold text-ink">{value} %</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={label ?? "Fortschritt"}
        className="h-2 overflow-hidden rounded-pill bg-paper-deep"
      >
        <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
