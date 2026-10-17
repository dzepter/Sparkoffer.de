import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  /** Sichtbares Label – Pflicht fuer verstaendliche Bedienung */
  label: ReactNode;
  /** Optionale Zusatzbeschreibung unter dem Label */
  description?: ReactNode;
}

export function Checkbox({ label, description, className, id, ...rest }: CheckboxProps) {
  return (
    // Grosszuegige Klickflaeche (min. 44px) ueber das gesamte Label
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-touch cursor-pointer items-start gap-3 py-2 select-none",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-green-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-green-deep"
        {...rest}
      />
      <span className="text-sm leading-5 text-ink">
        {label}
        {description ? <span className="mt-0.5 block text-ink-soft">{description}</span> : null}
      </span>
    </label>
  );
}
