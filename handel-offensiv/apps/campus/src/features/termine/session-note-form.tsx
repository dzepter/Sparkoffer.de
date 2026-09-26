"use client";

import { useActionState } from "react";

import { Banner, Button, FormField, Textarea } from "@handel-offensiv/ui";

import { INITIAL_FORM_STATE } from "@/lib/auth/form-state";

import { saveSessionNoteAction } from "./actions";

const MAX_LENGTH = 5000;

/**
 * Persoenliche Notiz zum Praesenztag (session_notes). Nur die Person selbst
 * sieht diese Notiz – weder Trainer noch Unternehmen (RLS session_notes_own).
 */
export function SessionNoteForm({
  sessionId,
  initialNote,
  updatedAtLabel,
}: {
  sessionId: string;
  initialNote: string;
  /** z. B. "Zuletzt gespeichert am 12.03.2027, 18:05 Uhr" */
  updatedAtLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveSessionNoteAction, INITIAL_FORM_STATE);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormField
        htmlFor="note"
        label="Meine Notiz zu diesem Tag"
        error={fe.note}
        hint="Nur für Sie sichtbar. Ideal für Merksätze, Aufgaben und Ihre Beobachtungen vom Offensivtag."
      >
        <Textarea
          id="note"
          name="note"
          rows={6}
          maxLength={MAX_LENGTH}
          defaultValue={initialNote}
          placeholder="Was nehme ich mit? Was probiere ich als Erstes aus?"
          invalid={fe.note !== undefined}
        />
      </FormField>
      {state.success ? <Banner kind="success" message={state.success} /> : null}
      {state.error && !state.fieldErrors ? <Banner kind="error" message={state.error} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Wird gespeichert …" : "Notiz speichern"}
        </Button>
        {updatedAtLabel ? <span className="text-xs text-ink-soft">{updatedAtLabel}</span> : null}
      </div>
    </form>
  );
}
