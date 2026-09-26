"use client";

import { useActionState } from "react";

import { CONTENT_STATUSES, type ContentStatus } from "@handel-offensiv/types";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_STATUS_LABELS, initialDialogState } from "@/lib/content-meta";

import { createProgramAction, updateProgramAction } from "./actions";

export interface ProgramFormValues {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: ContentStatus;
}

/** Formular fuer Programm anlegen/bearbeiten (Seiten /programme/neu und …/bearbeiten). */
export function ProgramForm({ program }: { program?: ProgramFormValues }) {
  const action = program ? updateProgramAction : createProgramAction;
  const [state, formAction, pending] = useActionState(action, initialDialogState);

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-5">
      {program ? <input type="hidden" name="programmId" value={program.id} /> : null}

      <FormField htmlFor="programm-titel" label="Titel" required>
        <Input id="programm-titel" name="titel" defaultValue={program?.title ?? ""} required />
      </FormField>

      <FormField
        htmlFor="programm-slug"
        label="Slug"
        required
        hint="Technischer Kurzname, z. B. handel-offensiv (Kleinbuchstaben, Ziffern, Bindestriche)."
      >
        <Input id="programm-slug" name="slug" defaultValue={program?.slug ?? ""} required />
      </FormField>

      <FormField htmlFor="programm-untertitel" label="Untertitel">
        <Input id="programm-untertitel" name="untertitel" defaultValue={program?.subtitle ?? ""} />
      </FormField>

      <FormField htmlFor="programm-beschreibung" label="Beschreibung">
        <Textarea
          id="programm-beschreibung"
          name="beschreibung"
          defaultValue={program?.description ?? ""}
        />
      </FormField>

      <FormField htmlFor="programm-status" label="Status" required>
        <Select id="programm-status" name="status" defaultValue={program?.status ?? "draft"}>
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

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : program ? "Speichern" : "Programm anlegen"}
        </Button>
      </div>
    </form>
  );
}
