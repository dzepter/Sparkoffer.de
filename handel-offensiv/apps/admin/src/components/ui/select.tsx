import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full min-h-touch rounded border bg-white px-3 text-base text-ink",
        "focus:outline-none focus:ring-2 focus:ring-green-deep focus:border-green-deep",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
