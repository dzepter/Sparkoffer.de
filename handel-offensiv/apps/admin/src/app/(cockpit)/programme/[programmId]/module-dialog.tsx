"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { CONTENT_STATUSES, type ContentStatus } from "@handel-offensiv/types";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_STATUS_LABELS, initialDialogState } from "@/lib/content-meta";

import { createModuleAction, updateModuleAction } from "../actions";

export interface ModuleDialogValues {
  id: string;
  number_label: string;
  title: string;
  claim: string | null;
  description: string | null;
  status: ContentStatus;
}

/**
 * Modul anlegen/bearbeiten im Dialog. Ohne `module` = Anlegen
 * (numberLabelVorschlag als Default, z. B. "03" bei zwei Modulen).
 */
export function ModuleDialog({
  programId,
  module,
  numberLabelVorschlag,
  triggerLabel,
  triggerVariant = "secondary",
  triggerSize = "sm",
}: {
  programId: string;
  module?: ModuleDialogValues;
  numberLabelVorschlag?: string;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const action = module ? updateModuleAction : createModuleAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);
  const lastTs = useRef(0);

  useEffect(() => {
    if (state.ok && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      setOpen(false);
    }
  }, [state]);

  const prefix = module ? `modul-${module.id}` : "modul-neu";

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={module ? "Modul bearbeiten" : "Modul anlegen"}
      >
        <form action={formAction} noValidate className="space-y-4">
          <input type="hidden" name="programmId" value={programId} />
          {module ? <input type="hidden" name="modulId" value={module.id} /> : null}

          <div className="grid grid-cols-[6rem_1fr] gap-4">
            <FormField htmlFor={`${prefix}-nummer`} label="Nummer" required>
              <Input
                id={`${prefix}-nummer`}
                name="nummer"
                defaultValue={module?.number_label ?? numberLabelVorschlag ?? "01"}
                maxLength={4}
                required
              />
            </FormField>
            <FormField htmlFor={`${prefix}-titel`} label="Titel" required>
              <Input id={`${prefix}-titel`} name="titel" defaultValue={module?.title ?? ""} required />
            </FormField>
          </div>

          <FormField htmlFor={`${prefix}-claim`} label="Claim" hint="Kurzer Leitsatz des Moduls.">
            <Input id={`${prefix}-claim`} name="claim" defaultValue={module?.claim ?? ""} />
          </FormField>

          <FormField htmlFor={`${prefix}-beschreibung`} label="Beschreibung">
            <Textarea
              id={`${prefix}-beschreibung`}
              name="beschreibung"
              defaultValue={module?.description ?? ""}
              rows={3}
            />
          </FormField>

          <FormField htmlFor={`${prefix}-status`} label="Status" required>
            <Select id={`${prefix}-status`} name="status" defaultValue={module?.status ?? "draft"}>
              {CONTENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTENT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
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
