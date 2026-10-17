import { Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "./cn";

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

type DescribableProps = { "aria-describedby"?: string | undefined };

/**
 * Formularfeld mit Label, Fehler (role=alert) und Hinweis.
 * Barrierefreiheit: Ist das Kind ein einzelnes Element (Input, Textarea,
 * Checkbox, ...), erhaelt es automatisch aria-describedby auf den Fehler-
 * bzw. Hinweistext, damit Screenreader ihn beim Fokussieren vorlesen. Ein
 * explizit gesetztes aria-describedby des Kindes bleibt erhalten.
 */
export function FormField({
  htmlFor,
  label,
  error,
  hint,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const describedBy = error ? `${htmlFor}-fehler` : hint ? `${htmlFor}-hinweis` : undefined;
  const content =
    describedBy !== undefined && isValidElement<DescribableProps>(children) && children.type !== Fragment
      ? cloneElement(children as ReactElement<DescribableProps>, {
          "aria-describedby": children.props["aria-describedby"] ?? describedBy,
        })
      : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-gold-deep">
            *
          </span>
        ) : null}
      </label>
      {content}
      {error ? (
        <p id={`${htmlFor}-fehler`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hinweis`} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
