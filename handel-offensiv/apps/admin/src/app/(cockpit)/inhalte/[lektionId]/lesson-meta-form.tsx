"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialDialogState } from "@/lib/content-meta";

import { updateLessonMetaAction } from "../actions";

/** "Entwurf speichern": Titel, Zusammenfassung, geschätzte Minuten. */
export function LessonMetaForm({
  lesson,
}: {
  lesson: { id: string; title: string; summary: string | null; estimated_minutes: number | null };
}) {
  const [state, formAction, pending] = useActionState(updateLessonMetaAction, initialDialogState);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="lektionId" value={lesson.id} />

      <FormField htmlFor="lektion-titel" label="Titel" required>
        <Input id="lektion-titel" name="titel" defaultValue={lesson.title} required />
      </FormField>

      <FormField htmlFor="lektion-zusammenfassung" label="Zusammenfassung">
        <Textarea
          id="lektion-zusammenfassung"
          name="zusammenfassung"
          defaultValue={lesson.summary ?? ""}
          rows={3}
        />
      </FormField>

      <FormField htmlFor="lektion-minuten" label="Geschätzte Minuten">
        <Input
          id="lektion-minuten"
          name="minuten"
          type="number"
          min={1}
          max={600}
          inputMode="numeric"
          defaultValue={lesson.estimated_minutes ?? ""}
          className="max-w-[10rem]"
        />
      </FormField>

      {state.error ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm font-bold text-success">
          Gespeichert.
        </p>
      ) : null}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Entwurf speichern"}
      </Button>
    </form>
  );
}
