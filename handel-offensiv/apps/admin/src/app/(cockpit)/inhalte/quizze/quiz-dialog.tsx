"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialDialogState } from "@/lib/content-meta";

import { createQuizAction, updateQuizAction } from "./actions";

export interface QuizDialogValues {
  id: string;
  title: string;
  description: string | null;
  pass_score: number | null;
  max_attempts: number | null;
  shuffle: boolean;
}

/** Quiz anlegen/bearbeiten: Titel, Bestehensgrenze, Versuche, Zufallsreihenfolge. */
export function QuizDialog({
  quiz,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  quiz?: QuizDialogValues;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const action = quiz ? updateQuizAction : createQuizAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const prefix = quiz ? `quiz-${quiz.id}` : "quiz-neu";

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={quiz ? "Quiz bearbeiten" : "Quiz anlegen"}
      >
        <form action={formAction} noValidate className="space-y-4">
          {quiz ? <input type="hidden" name="quizId" value={quiz.id} /> : null}

          <FormField htmlFor={`${prefix}-titel`} label="Titel" required>
            <Input id={`${prefix}-titel`} name="titel" defaultValue={quiz?.title ?? ""} required />
          </FormField>

          <FormField htmlFor={`${prefix}-beschreibung`} label="Beschreibung">
            <Textarea
              id={`${prefix}-beschreibung`}
              name="beschreibung"
              defaultValue={quiz?.description ?? ""}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              htmlFor={`${prefix}-bestehensgrenze`}
              label="Bestehensgrenze (Punkte)"
              hint="Leer = kein Bestehen erforderlich."
            >
              <Input
                id={`${prefix}-bestehensgrenze`}
                name="bestehensgrenze"
                type="number"
                min={0}
                defaultValue={quiz?.pass_score ?? ""}
              />
            </FormField>
            <FormField
              htmlFor={`${prefix}-versuche`}
              label="Maximale Versuche"
              hint="Leer = unbegrenzt."
            >
              <Input
                id={`${prefix}-versuche`}
                name="versuche"
                type="number"
                min={1}
                defaultValue={quiz?.max_attempts ?? ""}
              />
            </FormField>
          </div>

          <Checkbox
            id={`${prefix}-zufall`}
            name="zufall"
            defaultChecked={quiz?.shuffle ?? false}
            label="Fragen in Zufallsreihenfolge anzeigen"
          />

          {state.error ? (
            <p
              role="alert"
              className="rounded border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Wird gespeichert …" : "Speichern"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
