"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Badge, Button } from "@handel-offensiv/ui";

import { completeLessonAction, type BlockActionState } from "@/features/lernen/actions";
import { formatDateTime } from "@/features/lernen/format";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface CompleteLessonFormProps {
  lessonId: string;
  cohortId: string;
  completedAt: string | null;
  /** Anzahl noch offener Pflichtbloecke (serverseitig ermittelt) */
  missingCount: number;
  next: { id: string; title: string } | null;
}

/**
 * "Lektion abschließen" – die EINE goldene CTA der Lektionsansicht.
 * Fehlende Pflichtbloecke meldet die Server Action als deutsche Liste.
 */
export function CompleteLessonForm({ lessonId, cohortId, completedAt, missingCount, next }: CompleteLessonFormProps) {
  const [state, formAction, pending] = useActionState(completeLessonAction, INITIAL);
  const isCompleted = completedAt !== null || state.ok;

  return (
    <section aria-label="Lektion abschließen" className="rounded border border-line bg-white p-5">
      {isCompleted ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge tone="success">Abgeschlossen</Badge>
            <p className="mt-2 text-sm text-ink-soft">
              {completedAt ? `Abgeschlossen am ${formatDateTime(completedAt)}.` : "Diese Lektion ist abgeschlossen."} Sie können Ihre Einträge jederzeit ergänzen.
            </p>
          </div>
          {next ? (
            <Link
              href={`/lektionen/${next.id}`}
              className="inline-flex min-h-touch items-center justify-center rounded bg-gold-bright px-5 text-sm font-bold uppercase tracking-kicker text-navy hover:bg-gold"
            >
              Weiter: {next.title}
            </Link>
          ) : (
            <Link href="/programm" className="inline-flex min-h-touch items-center font-bold text-navy underline underline-offset-2">
              Zurück zum Programm
            </Link>
          )}
        </div>
      ) : (
        <form action={formAction} className="flex flex-wrap items-center justify-between gap-4">
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="cohortId" value={cohortId} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-ink">Alles bearbeitet?</p>
            <p className="mt-1 text-sm text-ink-soft">
              {missingCount > 0
                ? `Noch ${missingCount === 1 ? "ein Pflichtbaustein ist" : `${missingCount} Pflichtbausteine sind`} offen. Sie können die Lektion abschließen, sobald alles bearbeitet ist.`
                : "Schließen Sie die Lektion ab, um Ihren Fortschritt festzuhalten."}
            </p>
            {state.error ? (
              <p role="alert" className="mt-2 rounded border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-ink">
                {state.error}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Lektion abschließen"}
          </Button>
        </form>
      )}
    </section>
  );
}
