import type { ReactNode } from "react";

import { Badge, cn } from "@handel-offensiv/ui";

export interface BlockFrameProps {
  /** Anker-ID (fuer Links aus HEUTE: #block-<id>) */
  id: string;
  /** Kleines Label ueber dem Inhalt, z. B. "Reflexionsfrage" */
  label: string;
  required?: boolean;
  /** Bearbeitet (interaktive Bloecke) */
  done?: boolean;
  children: ReactNode;
  className?: string;
  /** Ohne weisse Karte (z. B. Textabschnitt, Ankuendigung) */
  plain?: boolean;
}

/**
 * Einheitlicher Rahmen je Inhaltsbaustein: Label + Pflicht-/Erledigt-Badge.
 * Rein Navy/Ink – Gold bleibt der Modulnummer und dem Abschluss-CTA vorbehalten.
 */
export function BlockFrame({ id, label, required = false, done = false, children, className, plain = false }: BlockFrameProps) {
  return (
    <section
      id={`block-${id}`}
      aria-label={label}
      className={cn("scroll-mt-24", plain ? "" : "rounded border border-line bg-white p-4 sm:p-5", className)}
    >
      {!plain || required ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{label}</p>
          {required ? <Badge tone="dark">Pflicht</Badge> : null}
          {done ? <Badge tone="success">Erledigt</Badge> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Hinweis bei ungueltiger Block-Konfiguration – nie technische Details. */
export function InvalidBlock({ id }: { id: string }) {
  return (
    <section id={`block-${id}`} className="rounded border border-line bg-paper p-4 text-sm text-ink-soft">
      Dieser Inhalt kann gerade nicht angezeigt werden.
    </section>
  );
}

/** Fehlermeldung in Formularen (deutsch, role=alert). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

/** Erfolgsmeldung "Gespeichert" (aria-live). */
export function SavedNote({ savedAt }: { savedAt: string | undefined }) {
  return (
    <p aria-live="polite" className="min-h-[1.25rem] text-xs text-success">
      {savedAt ? "Gespeichert." : ""}
    </p>
  );
}
