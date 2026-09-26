import type { InputHTMLAttributes } from "react";

import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Fehlerzustand (rote Umrandung + aria-invalid) */
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full min-h-touch rounded border bg-white px-3 text-base text-ink",
        "placeholder:text-ink-soft/60",
        "focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...rest}
    />
  );
}
