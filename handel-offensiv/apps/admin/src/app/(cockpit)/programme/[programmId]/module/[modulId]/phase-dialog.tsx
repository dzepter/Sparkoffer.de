"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { PHASE_TYPES, type PhaseType } from "@handel-offensiv/types";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { initialDialogState, PHASE_TYPE_LABELS } from "@/lib/content-meta";

import { createPhaseAction, updatePhaseAction } from "../../../actions";

export interface PhaseDialogValues {
  id: string;
  phase_type: PhaseType;
  title: string;
}

/** Lernphase anlegen/bearbeiten (§8: phase_type + frei definierbarer Titel). */
export function PhaseDialog({
  programId,
  moduleId,
  phase,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  programId: string;
  moduleId: string;
  phase?: PhaseDialogValues;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const action = phase ? updatePhaseAction : createPhaseAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const prefix = phase ? `phase-${phase.id}` : "phase-neu";

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={phase ? "Lernphase bearbeiten" : "Lernphase anlegen"}
      >
        <form action={formAction} noValidate className="space-y-4">
          <input type="hidden" name="programmId" value={programId} />
          <input type="hidden" name="modulId" value={moduleId} />
          {phase ? <input type="hidden" name="phaseId" value={phase.id} /> : null}

          <FormField htmlFor={`${prefix}-typ`} label="Phasentyp" required>
            <Select id={`${prefix}-typ`} name="phasenTyp" defaultValue={phase?.phase_type ?? "before_day"}>
              {PHASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PHASE_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            htmlFor={`${prefix}-titel`}
            label="Titel"
            required
            hint='Frei formulierbar, z. B. "Vor dem Spieltag" oder "Transfer in den Alltag".'
          >
            <Input id={`${prefix}-titel`} name="titel" defaultValue={phase?.title ?? ""} required />
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
