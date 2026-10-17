"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { QUESTION_KINDS, type QuestionKind } from "@handel-offensiv/types";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialDialogState, QUESTION_KIND_LABELS } from "@/lib/content-meta";

import { createQuestionAction, updateQuestionAction } from "../actions";

export interface QuestionDialogValues {
  id: string;
  kind: QuestionKind;
  body: string;
  explanation: string | null;
  points: number;
  options: Array<{ body: string; is_correct: boolean }>;
}

/** Quizfrage anlegen/bearbeiten inkl. Optionen und Erklärung. */
export function QuestionDialog({
  quizId,
  question,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  quizId: string;
  question?: QuestionDialogValues;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<QuestionKind>(question?.kind ?? "single");
  const action = question ? updateQuestionAction : createQuestionAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const prefix = question ? `frage-${question.id}` : "frage-neu";

  const optionLines = (question?.options ?? [])
    .map((option) => (option.is_correct ? `* ${option.body}` : option.body))
    .join("\n");
  const truefalseDefault =
    question?.options.find((option) => option.is_correct)?.body === "Falsch" ? "falsch" : "richtig";

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={question ? "Frage bearbeiten" : "Frage anlegen"}
        className="max-w-2xl"
      >
        <form action={formAction} noValidate className="space-y-4">
          <input type="hidden" name="quizId" value={quizId} />
          {question ? <input type="hidden" name="frageId" value={question.id} /> : null}

          <div className="grid grid-cols-[1fr_8rem] gap-4">
            <FormField htmlFor={`${prefix}-typ`} label="Fragetyp" required>
              <Select
                id={`${prefix}-typ`}
                name="fragetyp"
                value={kind}
                onChange={(event) => {
                  const value = event.target.value as QuestionKind;
                  setKind(QUESTION_KINDS.includes(value) ? value : "single");
                }}
              >
                {QUESTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {QUESTION_KIND_LABELS[k]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor={`${prefix}-punkte`} label="Punkte" required>
              <Input
                id={`${prefix}-punkte`}
                name="punkte"
                type="number"
                min={1}
                max={100}
                defaultValue={question?.points ?? 1}
              />
            </FormField>
          </div>

          <FormField htmlFor={`${prefix}-fragetext`} label="Fragetext" required>
            <Textarea
              id={`${prefix}-fragetext`}
              name="fragetext"
              defaultValue={question?.body ?? ""}
              rows={3}
              required
            />
          </FormField>

          {kind === "single" || kind === "multiple" ? (
            <FormField
              htmlFor={`${prefix}-optionen`}
              label="Antwortoptionen"
              required
              hint={
                kind === "single"
                  ? 'Eine Option pro Zeile; die richtige Antwort mit "* " am Zeilenanfang markieren (genau eine).'
                  : 'Eine Option pro Zeile; richtige Antworten mit "* " am Zeilenanfang markieren.'
              }
            >
              <Textarea
                id={`${prefix}-optionen`}
                name="optionen"
                defaultValue={optionLines}
                rows={5}
                required
              />
            </FormField>
          ) : null}

          {kind === "truefalse" ? (
            <FormField htmlFor={`${prefix}-richtigFalsch`} label="Richtige Antwort" required>
              <Select
                id={`${prefix}-richtigFalsch`}
                name="richtigFalsch"
                defaultValue={truefalseDefault}
              >
                <option value="richtig">Richtig</option>
                <option value="falsch">Falsch</option>
              </Select>
            </FormField>
          ) : null}

          {kind === "freetext" ? (
            <p className="rounded border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
              Freitext-Antworten werden nicht automatisch bewertet und zählen nicht in die
              Punktwertung.
            </p>
          ) : null}

          <FormField
            htmlFor={`${prefix}-erklaerung`}
            label="Erklärung"
            hint="Wird Teilnehmern nach der Beantwortung angezeigt."
          >
            <Textarea
              id={`${prefix}-erklaerung`}
              name="erklaerung"
              defaultValue={question?.explanation ?? ""}
              rows={2}
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
