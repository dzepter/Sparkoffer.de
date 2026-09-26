"use client";

import { useActionState } from "react";

import type { MemberRole } from "@handel-offensiv/types";

import { Select } from "@/components/ui";
import { changeMembershipRoleAction, type RoleChangeState } from "./actions";

const INITIAL: RoleChangeState = { error: null, done: false };

export const ROLE_LABELS: Record<MemberRole, string> = {
  org_admin: "Org-Admin",
  trainer: "Trainer",
  participant: "Teilnehmer",
};

/**
 * Rollenwechsel je Mitgliedschaft: Auswahl + expliziter Speichern-Button
 * (kein Auto-Submit bei onChange – bewusste Aktion, klarer Fokusfluss).
 */
export function RoleSelect({
  membershipId,
  currentRole,
  personLabel,
  organizationLabel,
}: {
  membershipId: string;
  currentRole: MemberRole;
  personLabel: string;
  organizationLabel: string;
}) {
  const [state, formAction, pending] = useActionState(changeMembershipRoleAction, INITIAL);
  const selectId = `rolle-${membershipId}`;

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="membershipId" value={membershipId} />
      <label htmlFor={selectId} className="sr-only">
        Rolle von {personLabel} bei {organizationLabel}
      </label>
      <Select
        id={selectId}
        name="role"
        defaultValue={currentRole}
        disabled={pending}
        className="w-auto min-w-40"
      >
        {(Object.keys(ROLE_LABELS) as MemberRole[]).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-touch items-center rounded px-3 text-xs font-bold uppercase tracking-kicker text-green-deep hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Speichert …" : "Übernehmen"}
      </button>

      {state.error ? (
        <p role="alert" className="basis-full text-xs text-danger">
          {state.error}
        </p>
      ) : null}
      {state.done ? (
        <p role="status" className="basis-full text-xs text-success">
          Rolle gespeichert.
        </p>
      ) : null}
    </form>
  );
}
