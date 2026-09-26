"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { OrganizationRow, OrgStatus } from "@handel-offensiv/types";

import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import { saveOrganizationAction, type OrganizationFormState } from "./actions";

const STATUS_LABELS: Record<OrgStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  archived: "Archiviert",
};

const INITIAL: OrganizationFormState = { error: null };

/** Formular Neu/Bearbeiten (§21) – Validierung serverseitig via Zod. */
export function OrganizationForm({ organization }: { organization?: OrganizationRow }) {
  const [state, formAction, pending] = useActionState(saveOrganizationAction, INITIAL);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5" noValidate>
      {organization ? <input type="hidden" name="id" value={organization.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField htmlFor="org-name" label="Name" required error={fe.name}>
          <Input
            id="org-name"
            name="name"
            defaultValue={organization?.name ?? ""}
            invalid={Boolean(fe.name)}
            autoComplete="organization"
            required
          />
        </FormField>
        <FormField htmlFor="org-short" label="Kurzname" error={fe.shortName}>
          <Input id="org-short" name="shortName" defaultValue={organization?.short_name ?? ""} />
        </FormField>
      </div>

      <FormField
        htmlFor="org-logo"
        label="Logo (Pfad)"
        error={fe.logoPath}
        hint="Optional: Pfad zu einer bereits hochgeladenen Logodatei im Speicher."
      >
        <Input
          id="org-logo"
          name="logoPath"
          defaultValue={organization?.logo_path ?? ""}
          placeholder="z. B. logos/muster-gmbh.png"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField htmlFor="org-contact" label="Ansprechpartner" error={fe.contactName}>
          <Input id="org-contact" name="contactName" defaultValue={organization?.contact_name ?? ""} />
        </FormField>
        <FormField htmlFor="org-email" label="E-Mail" error={fe.contactEmail}>
          <Input
            id="org-email"
            name="contactEmail"
            type="email"
            defaultValue={organization?.contact_email ?? ""}
            invalid={Boolean(fe.contactEmail)}
          />
        </FormField>
        <FormField htmlFor="org-phone" label="Telefon" error={fe.contactPhone}>
          <Input id="org-phone" name="contactPhone" type="tel" defaultValue={organization?.contact_phone ?? ""} />
        </FormField>
        <FormField htmlFor="org-status" label="Status" error={fe.status}>
          <Select id="org-status" name="status" defaultValue={organization?.status ?? "active"}>
            {(Object.keys(STATUS_LABELS) as OrgStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField htmlFor="org-address" label="Adresse" error={fe.address}>
        <Textarea id="org-address" name="address" rows={2} defaultValue={organization?.address ?? ""} />
      </FormField>

      <FormField
        htmlFor="org-notes"
        label="Interne Notizen"
        error={fe.internalNotes}
        hint="Nur im Cockpit sichtbar – nicht für Teilnehmer."
      >
        <Textarea id="org-notes" name="internalNotes" defaultValue={organization?.internal_notes ?? ""} />
      </FormField>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <Link
          href="/unternehmen"
          className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
