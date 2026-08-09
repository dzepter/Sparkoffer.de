import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface FormFieldProps {
  /** id des Eingabeelements (htmlFor-Verknuepfung) */
  htmlFor: string;
  label: string;
  /** Deutsche Fehlermeldung (z. B. aus Zod) */
  error?: string | undefined;
  /** Optionaler Hinweistext unter dem Feld */
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  htmlFor,
  label,
  error,
  hint,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-green-deep">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-fehler`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}
