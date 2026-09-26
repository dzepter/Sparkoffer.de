"use client";

import { useActionState } from "react";

import { Button, FormField, Textarea } from "@/components/ui";
import { giveFeedbackAction, type FeedbackFormState } from "../actions";

const INITIAL: FeedbackFormState = { error: null, done: false };

/**
 * Feedback zu einer Abgabe (Insert trainer_feedback).
 * Der Status der Abgabe wechselt serverseitig auf "Feedback gegeben".
 */
export function FeedbackForm({
  submissionId,
  cohortId,
}: {
  submissionId: string;
  cohortId: string;
}) {
  const [state, formAction, pending] = useActionState(giveFeedbackAction, INITIAL);
  const fieldId = `feedback-${submissionId}`;

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="cohortId" value={cohortId} />

      {state.error ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.done ? (
        <p
          role="status"
          className="rounded border border-success/40 bg-success/5 px-4 py-3 text-sm text-success"
        >
          Ihr Feedback wurde gespeichert und ist für die Person sichtbar.
        </p>
      ) : null}

      <FormField htmlFor={fieldId} label="Feedback geben">
        <Textarea
          id={fieldId}
          name="body"
          rows={3}
          maxLength={4000}
          placeholder="Was war stark? Was ist der nächste Schritt?"
          required
        />
      </FormField>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Feedback speichern"}
      </Button>
    </form>
  );
}
