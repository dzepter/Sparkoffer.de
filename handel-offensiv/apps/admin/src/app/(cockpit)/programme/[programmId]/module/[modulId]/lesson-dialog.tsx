"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialDialogState } from "@/lib/content-meta";

import { createLessonAction, updateLessonAction } from "../../../actions";

export interface LessonDialogValues {
  id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
}

/**
 * Lektion anlegen/bearbeiten (Titel, Zusammenfassung, geschätzte Minuten).
 * Inhalte (Content-Blöcke) und Statuswechsel: Bereich INHALTE.
 */
export function LessonDialog({
  programId,
  moduleId,
  phaseId,
  lesson,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  programId: string;
  moduleId: string;
  phaseId: string;
  lesson?: LessonDialogValues;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const action = lesson ? updateLessonAction : createLessonAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const prefix = lesson ? `lektion-${lesson.id}` : `lektion-neu-${phaseId}`;

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={lesson ? "Lektion bearbeiten" : "Lektion anlegen"}
      >
        <form action={formAction} noValidate className="space-y-4">
          <input type="hidden" name="programmId" value={programId} />
          <input type="hidden" name="modulId" value={moduleId} />
          <input type="hidden" name="phaseId" value={phaseId} />
          {lesson ? <input type="hidden" name="lektionId" value={lesson.id} /> : null}

          <FormField htmlFor={`${prefix}-titel`} label="Titel" required>
            <Input id={`${prefix}-titel`} name="titel" defaultValue={lesson?.title ?? ""} required />
          </FormField>

          <FormField htmlFor={`${prefix}-zusammenfassung`} label="Zusammenfassung">
            <Textarea
              id={`${prefix}-zusammenfassung`}
              name="zusammenfassung"
              defaultValue={lesson?.summary ?? ""}
              rows={3}
            />
          </FormField>

          <FormField htmlFor={`${prefix}-minuten`} label="Geschätzte Minuten">
            <Input
              id={`${prefix}-minuten`}
              name="minuten"
              type="number"
              min={1}
              max={600}
              inputMode="numeric"
              defaultValue={lesson?.estimated_minutes ?? ""}
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
