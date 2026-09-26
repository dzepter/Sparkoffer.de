import type { TextareaHTMLAttributes } from "react";

import { cn } from "./cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full rounded border bg-white px-3 py-2.5 text-base text-ink",
        "placeholder:text-ink-soft/60",
        "focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...rest}
    />
  );
}
