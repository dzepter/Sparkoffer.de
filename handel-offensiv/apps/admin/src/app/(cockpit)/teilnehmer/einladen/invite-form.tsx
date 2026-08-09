"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { MemberRole } from "@handel-offensiv/types";

import { Button, FormField, Input, Select } from "@/components/ui";
import { inviteAction, type InviteFormState } from "../actions";

export interface InviteOrgOption {
  id: string;
  name: string;
}
export interface InviteCohortOption {
  id: string;
  name: string;
  organizationId: string;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  participant: "Teilnehmer",
  trainer: "Trainer",
  org_admin: "Org-Admin",
};

const INITIAL: InviteFormState = { error: null };

/** Einzel-Einladung (invitationCreateSchema). Rollen ausser Teilnehmer nur Super Admin. */
export function InviteForm({
  organizations,
  cohorts,
  allowRoleChoice,
}: {
  organizations: InviteOrgOption[];
  cohorts: InviteCohortOption[];
  allowRoleChoice: boolean;
}) {
  const [state, formAction, pending] = useActionState(inviteAction, INITIAL);
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const fe = state.fieldErrors ?? {};

  const orgCohorts = cohorts.filter((c) => c.organizationId === orgId);

  return (
    <form action={formAction} className="max-w-xl space-y-5" noValidate>
      {state.error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <FormField htmlFor="inv-email" label="E-Mail-Adresse" required error={fe.email}>
        <Input
          id="inv-email"
          name="email"
          type="email"
          autoComplete="off"
          invalid={Boolean(fe.email)}
          placeholder="name@unternehmen.de"
          required
        />
      </FormField>

      <FormField htmlFor="inv-org" label="Organisation" required error={fe.organizationId}>
        <Select
          id="inv-org"
          name="organizationId"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          invalid={Boolean(fe.organizationId)}
          required
        >
          <option value="" disabled>
            Bitte wählen
          </option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        htmlFor="inv-cohort"
        label="Gruppe (optional)"
        error={fe.cohortId}
        hint="Die Person wird nach Annahme der Einladung dieser Gruppe zugeordnet."
      >
        <Select id="inv-cohort" name="cohortId" defaultValue="">
          <option value="">Keine Gruppe</option>
          {orgCohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      {allowRoleChoice ? (
        <FormField htmlFor="inv-role" label="Rolle" error={fe.role}>
          <Select id="inv-role" name="role" defaultValue="participant">
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </FormField>
      ) : (
        <input type="hidden" name="role" value="participant" />
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird versendet …" : "Einladung senden"}
        </Button>
        <Link
          href="/teilnehmer"
          className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
