"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { CohortRow, OrgStatus } from "@handel-offensiv/types";

import { Button, FormField, Input, Select } from "@/components/ui";
import { saveCohortAction, type CohortFormState } from "./actions";

export interface OptionItem {
  id: string;
  label: string;
}

const STATUS_LABELS: Record<OrgStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  archived: "Archiviert",
};

const INITIAL: CohortFormState = { error: null };

/** Formular Neu/Bearbeiten einer Gruppe (cohortSchema). */
export function CohortForm({
  cohort,
  organizations,
  programs,
}: {
  cohort?: CohortRow;
  organizations: OptionItem[];
  programs: OptionItem[];
}) {
  const [state, formAction, pending] = useActionState(saveCohortAction, INITIAL);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5" noValidate>
      {cohort ? <input type="hidden" name="id" value={cohort.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <FormField htmlFor="cohort-name" label="Name" required error={fe.name}>
        <Input
          id="cohort-name"
          name="name"
          defaultValue={cohort?.name ?? ""}
          invalid={Boolean(fe.name)}
          placeholder="z. B. Frühjahrsstaffel 2026"
          required
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField htmlFor="cohort-org" label="Organisation" required error={fe.organizationId}>
          <Select
            id="cohort-org"
            name="organizationId"
            defaultValue={cohort?.organization_id ?? ""}
            invalid={Boolean(fe.organizationId)}
            required
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField htmlFor="cohort-program" label="Programm" required error={fe.programId}>
          <Select
            id="cohort-program"
            name="programId"
            defaultValue={cohort?.program_id ?? ""}
            invalid={Boolean(fe.programId)}
            required
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <FormField htmlFor="cohort-start" label="Startdatum" error={fe.startDate}>
          <Input id="cohort-start" name="startDate" type="date" defaultValue={cohort?.start_date ?? ""} />
        </FormField>
        <FormField htmlFor="cohort-end" label="Enddatum" error={fe.endDate}>
          <Input
            id="cohort-end"
            name="endDate"
            type="date"
            defaultValue={cohort?.end_date ?? ""}
            invalid={Boolean(fe.endDate)}
          />
        </FormField>
        <FormField htmlFor="cohort-status" label="Status" error={fe.status}>
          <Select id="cohort-status" name="status" defaultValue={cohort?.status ?? "active"}>
            {(Object.keys(STATUS_LABELS) as OrgStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <Link
          href="/gruppen"
          className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
