import { cn } from "./cn";

export interface ModuleNumberProps {
  /** z. B. "01" */
  label: string;
  size?: "md" | "lg";
  onDark?: boolean;
  className?: string;
}

/** Grosse Modulnummer 01–05 in Gold (Markenelement, sparsam). */
export function ModuleNumber({ label, size = "md", onDark = false, className }: ModuleNumberProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block font-extrabold leading-none tracking-tight",
        size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl",
        onDark ? "text-gold-bright" : "text-gold",
        className,
      )}
    >
      {label}
    </span>
  );
}
