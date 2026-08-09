import { cn } from "@/lib/cn";

export interface LoadingStateProps {
  /** Screenreader-Text, Default "Wird geladen …" */
  label?: string;
  /** Anzahl der Skeleton-Zeilen */
  rows?: number;
  className?: string;
}

export function LoadingState({ label = "Wird geladen …", rows = 3, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("rounded border border-line bg-white p-5", className)}
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-line/70"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
